import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { env } from "~/env";

/**
 * Story shape returned by generateForProfile
 * This represents a real story/case study that matches the user's profile
 */
export interface StoryForProfile {
  id: string;
  title: string;
  sourceUrl: string;
  sourceType: "video" | "article" | "linkedin" | "other";
  shortSummary: string;
  whyItMatches: string;
}

/**
 * Raw search result from web search API
 */
type RawSearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

// ============================================================================
// RELEVANCE FILTER HELPER
// ============================================================================

/**
 * Filter out obviously irrelevant Tavily results (school catalogs, random PDFs, etc.)
 */
function filterSearchResultsForRelevance(opts: {
  searchResults: RawSearchResult[];
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
}): RawSearchResult[] {
  const { searchResults, profile } = opts;

  const interestTokens = (profile.interests || "")
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);

  const mustHaveKeywords = [
    "career",
    "job",
    "jobs",
    "entry level",
    "internship",
    "internships",
    "sales",
    "business",
    "business development",
    "account executive",
    "sales development representative",
    "bdr",
    "sdr",
  ];

  const badPatterns = [
    /student catalog/i,
    /\bcatalog\b/i,
    /handbook/i,
    /version ii/i,
    /technical college/i,
    /student-parent handbook/i,
    /policies and procedures/i,
    /press release/i,
    /global releases/i,
  ];

  return searchResults.filter((r) => {
    const title = (r.title || "").toLowerCase();
    const snippet = (r.snippet || "").toLowerCase();
    const url = (r.url || "").toLowerCase();

    const text = `${title} ${snippet} ${url}`;

    // Drop obviously bad patterns
    if (badPatterns.some((re) => re.test(text))) {
      return false;
    }

    // Filter out tech/quantum stuff when user doesn't mention it
    const hasTechKeyword = /quantum|machine learning|deep learning|ai model|neural network/i.test(text);

    const userMentionsTech =
      /quantum|ai|artificial intelligence|machine learning/i.test(profile.interests || "") ||
      /quantum|ai|artificial intelligence|machine learning/i.test(profile.extraInfo || "");

    if (hasTechKeyword && !userMentionsTech) {
      return false;
    }

    // Require at least one general career / role keyword
    const hasCareerKeyword = mustHaveKeywords.some((kw) =>
      text.includes(kw),
    );

    // Soft boost: if any of the interests appear, we keep it
    const hasInterestMatch =
      interestTokens.length > 0 &&
      interestTokens.some((tok) => tok.length >= 3 && text.includes(tok));

    return hasCareerKeyword || hasInterestMatch;
  });
}

// ============================================================================
// GEMINI API CONSTANTS
// ============================================================================

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================================================
// WEB SEARCH HELPER (Tavily API)
// ============================================================================

/**
 * Search the web for relevant career stories using Tavily API
 * Uses official Tavily HTTP API endpoint
 */
async function webSearchForStories(opts: {
  query: string;
  apiKey: string;
  limit?: number;
}): Promise<RawSearchResult[]> {
  const limit = opts.limit ?? 8;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: opts.apiKey,
        query: opts.query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: limit,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.warn("[stories] error - Tavily API HTTP error", {
        status: response.status,
        error: errorText.slice(0, 500),
      });
      return [];
    }

    const data = (await response.json()) as {
      results?: Array<{
        title?: string;
        url?: string;
        content?: string;
      }>;
    };

    if (!data.results || !Array.isArray(data.results)) {
      console.warn("[stories] error - Tavily returned invalid response format");
      return [];
    }

    const results = data.results
      .filter((r) => r.title && r.url)
      .map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        snippet: r.content?.slice(0, 300),
      }));

    return results;
  } catch (error) {
    console.warn("[stories] error - Web search exception", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

// ============================================================================
// PATH-AWARE RESULT SELECTION HELPER
// ============================================================================

/**
 * Select a path-specific slice of Tavily search results.
 * This ensures different paths show different stories even from the same search.
 */
function selectSearchResultsForPath(opts: {
  searchResults: RawSearchResult[];
  limit?: number;
  pathRank?: number;
}): RawSearchResult[] {
  const limit = opts.limit ?? 4;
  const total = opts.searchResults.length;
  let selected: RawSearchResult[] = [];

  // Simple heuristic to vary which results are shown per path:
  // - Path 1 (Conventional): earliest results
  // - Path 2 (Project & Portfolio Heavy): middle chunk
  // - Path 3 (Unconventional / Cross-Discipline): later results
  if (opts.pathRank === 2 && total > limit * 2) {
    const start = Math.floor(total / 3);
    selected = opts.searchResults.slice(start, start + limit);
  } else if (opts.pathRank === 3 && total > limit * 2) {
    const start = Math.max(total - limit - 2, 0);
    selected = opts.searchResults.slice(start, start + limit);
  } else {
    // Default / Path 1 or insufficient results: use first chunk
    selected = opts.searchResults.slice(0, limit);
  }

  return selected;
}

// ============================================================================
// SEARCH RESULT → STORY HELPER (Tavily-only fallback)
// ============================================================================

/**
 * Build StoryForProfile entries directly from Tavily search results.
 * This is used when we want real stories even if Gemini is unavailable/broken.
 */
function buildStoriesFromSearchResults(opts: {
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
  searchResults: RawSearchResult[];
  limit?: number;
  pathRank?: number;
}): StoryForProfile[] {
  const { profile, searchResults } = opts;
  const limit = opts.limit ?? 4;

  // Use the path-aware selection helper
  const selected = selectSearchResultsForPath({
    searchResults,
    limit,
    pathRank: opts.pathRank,
  });

  return selected.map((r, index) => {
    const url = (r.url ?? "").toLowerCase();

    // Infer sourceType from URL
    let sourceType: StoryForProfile["sourceType"] = "article";
    if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) {
      sourceType = "video";
    } else if (url.includes("linkedin.com")) {
      sourceType = "linkedin";
    }

    return {
      id: `search-${index + 1}`,
      title: r.title || "Career story",
      sourceUrl: r.url || "https://example.com",
      sourceType,
      shortSummary:
        r.snippet?.slice(0, 400) ??
        "A real career story pulled from the web that looks similar to your situation.",
      whyItMatches: `This story was found based on your background (${profile.currentStatus}), interests (${profile.interests}), stage (${profile.stage}), and the "${pathRankLabel(opts.pathRank)}" path.`,
    };
  });
}

function pathRankLabel(pathRank?: number): string {
  if (pathRank === 2) return "Project & Portfolio Heavy";
  if (pathRank === 3) return "Unconventional / Cross-Discipline";
  return "Conventional";
}

/**
 * Get path-specific keywords for Tavily search
 */
function getKeywordsForPath(pathRank: number, pathLabel: string): string[] {
  if (pathRank === 1 || /conventional/i.test(pathLabel)) {
    return [
      "internship",
      "co-op",
      "entry-level sales",
      "business development",
      "student",
      "early career",
    ];
  } else if (pathRank === 2 || /project/i.test(pathLabel)) {
    return [
      "student portfolio",
      "portfolio projects",
      "case study",
      "self-directed project",
      "sales side project",
    ];
  } else if (pathRank === 3 || /unconventional|cross-?discipline/i.test(pathLabel)) {
    return [
      "career switch",
      "nonlinear career",
      "hybrid role",
      "cross-disciplinary",
      "unconventional path",
    ];
  }
  return [];
}

// ============================================================================
// GEMINI AI SUMMARIZER HELPER
// ============================================================================

/**
 * Helper to infer sourceType from URL
 */
function inferSourceType(url: string): "video" | "article" | "linkedin" | "other" {
  const lower = url.toLowerCase();
  if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com")) {
    return "video";
  }
  if (lower.includes("linkedin.com")) {
    return "linkedin";
  }
  return "article";
}

/**
 * Use Gemini AI to summarize Tavily search results and write personalized summaries.
 * Takes Tavily results (title, URL, snippet) and returns StoryForProfile[] with
 * Gemini-written shortSummary and whyItMatches.
 * Returns empty array on any error (caller should handle fallback).
 */
async function generateStoriesWithGemini(opts: {
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
  pathRank?: number;
  pathLabel?: string;
  results: RawSearchResult[];
  apiKey: string;
}): Promise<StoryForProfile[]> {
  try {
    console.log("[stories] gemini summarize input", {
      resultsCount: opts.results.length,
      pathRank: opts.pathRank,
      pathLabel: opts.pathLabel,
    });

    // Build path label
    const pathLabelText = opts.pathLabel || pathRankLabel(opts.pathRank);

    // Build search results text for prompt
    const searchResultsText = opts.results
      .map(
        (r, i) =>
          `${i}) Title: ${r.title || "Untitled"}\n   URL: ${r.url || ""}\n   Snippet: ${r.snippet || "No snippet available"}\n`
      )
      .join("\n");

    // Build prompt asking for summaries only
    const prompt = `You are a career advisor helping someone find relevant career transition stories.

User Profile:
- Current Status: ${opts.profile.currentStatus}
- Interests: ${opts.profile.interests}
- Timeline: ${opts.profile.timeline}
- Stage: ${opts.profile.stage}
${opts.profile.extraInfo ? `- Extra Context: ${opts.profile.extraInfo}` : ""}

Current path: ${pathLabelText}

Here are ${opts.results.length} search results:

${searchResultsText}

Your task:
Only create stories for results that are clearly relevant to this user's situation (${opts.profile.currentStatus} background, interest in ${opts.profile.interests}, ${opts.profile.stage} stage, and their ${pathLabelText} path type). If a result is mostly about school catalogs, generic college handbooks, or unrelated technical fields, IGNORE it completely and do not create a story for it.

For each RELEVANT result (indexed 0 to ${opts.results.length - 1}), write:
1. shortSummary: 2-3 sentences summarizing this specific article/video/story
2. whyItMatches: 1-2 sentences explaining why this story is relevant to THIS user profile and THIS path

Return between 2 and 5 stories. If fewer than 2 results are relevant, just return stories for those and ignore the rest.

Return ONLY valid JSON in this exact shape (no markdown, no code fences, no commentary):
{
  "stories": [
    {
      "index": 0,
      "shortSummary": "2-3 sentence summary of this specific link",
      "whyItMatches": "1-2 sentences tailored to THIS user and THIS path"
    },
    {
      "index": 1,
      "shortSummary": "...",
      "whyItMatches": "..."
    }
  ]
}

Make sure you return one entry per relevant result, with the index matching the result order above. Skip any irrelevant results completely.`;

    // Call Gemini REST API with JSON mode
    console.log("[stories] Gemini request", {
      model: GEMINI_MODEL,
      promptLength: prompt.length,
    });

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.warn("[stories] Gemini summarize HTTP error", {
        status: response.status,
        error: errorText.slice(0, 500),
      });
      return [];
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!rawText) {
      console.warn("[stories] Gemini summarize returned empty response");
      return [];
    }

    console.log("[stories] raw Gemini summarize output (trimmed)", rawText.slice(0, 300));

    // Parse JSON - strip code fences if Gemini ignored response_mime_type
    let jsonText = rawText.trim();

    // Strip code fences if Gemini wrapped in ```json
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.warn("[stories] Gemini summarize parse error", {
        message: err instanceof Error ? err.message : String(err),
        jsonPreview: jsonText.slice(0, 200),
      });
      return [];
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray((parsed as any).stories)
    ) {
      console.warn("[stories] Gemini summarize returned JSON without 'stories' array");
      return [];
    }

    const geminiStories = (parsed as {
      stories: Array<{
        index: number;
        shortSummary: string;
        whyItMatches: string;
      }>;
    }).stories;

    // Map Gemini summaries back to StoryForProfile[] using Tavily data
    const mappedStories: StoryForProfile[] = [];

    for (const story of geminiStories) {
      const index = story.index;
      if (index < 0 || index >= opts.results.length) {
        console.warn(`[stories] Gemini story index ${index} out of range, skipping`);
        continue;
      }

      const r = opts.results[index];
      if (!r || !r.url || !r.title) {
        console.warn(`[stories] Gemini story index ${index} missing result, URL, or title, skipping`);
        continue;
      }

      if (!story.shortSummary || !story.whyItMatches) {
        console.warn(`[stories] Gemini story index ${index} missing summary fields, skipping`);
        continue;
      }

      mappedStories.push({
        id: `gemini-${opts.pathRank ?? 1}-${index}`,
        title: r.title,
        sourceUrl: r.url,
        sourceType: inferSourceType(r.url),
        shortSummary: story.shortSummary,
        whyItMatches: story.whyItMatches,
      });
    }

    console.log("[stories] parsed Gemini stories", mappedStories.length);

    return mappedStories;
  } catch (error) {
    console.warn("[stories] Gemini summarize exception", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

// ============================================================================
// GEMINI OVERVIEW HELPER
// ============================================================================

/**
 * Use Gemini AI to generate a plain text overview for a path.
 * Returns null on any error (caller should handle fallback).
 */
async function generatePathOverviewWithGemini(opts: {
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
  pathRank?: number;
  pathLabel?: string;
  searchResults: RawSearchResult[];
  apiKey: string;
}): Promise<string | null> {
  try {
    const pathRank = opts.pathRank ?? 1;
    const pathLabelText =
      opts.pathLabel ||
      (pathRank === 2
        ? "Project & Portfolio Heavy"
        : pathRank === 3
          ? "Unconventional / Cross-Discipline"
          : "Conventional");

    console.log("[stories] calling Gemini for overview", {
      currentStatus: opts.profile.currentStatus,
      interests: opts.profile.interests,
      stage: opts.profile.stage,
      timeline: opts.profile.timeline,
      pathRank: opts.pathRank,
      pathLabel: opts.pathLabel,
      searchResultsCount: opts.searchResults.length,
    });

    // Build search results text for prompt
    const searchResultsText = opts.searchResults
      .map(
        (r, i) =>
          `${i + 1}. Title: ${r.title || "Untitled"}\n   Snippet: ${r.snippet || "No snippet available"}\n   URL: ${r.url || ""}\n`
      )
      .join("\n");

    // Build path-specific style hint
    let pathStyleHint = "";

    if (pathRank === 1) {
      pathStyleHint = "Focus mainly on conventional, structured routes like internships, entry-level roles, and well-defined corporate programs.";
    } else if (pathRank === 2) {
      pathStyleHint = "Focus mainly on self-directed projects and portfolio pieces. Talk about building real artifacts like: a small outbound sales campaign, a mini CRM pipeline in a free tool, a case study about helping a student club or small business improve their outreach, or a simple Notion/Google Sheet tracking prospects and follow-ups. Internships can be mentioned briefly, but the core of this path is what they build themselves and can show as a portfolio.";
    } else if (pathRank === 3) {
      pathStyleHint = "Focus on unconventional or cross-discipline paths, creative combinations of skills, and non-linear moves.";
    }

    // Build prompt asking for a clean, skim-friendly overview
    const prompt = `You are a calm, practical career coach writing inside a modern career app. 
Write in simple, direct language that is easy to skim on a phone.

User profile:
- Current status: ${opts.profile.currentStatus || "not specified"}
- Interests: ${opts.profile.interests || "not specified"}
- Timeline: ${opts.profile.timeline || "not specified"}
- Stage: ${opts.profile.stage || "not specified"}
${opts.profile.extraInfo ? `- Extra info: ${opts.profile.extraInfo}` : ""}

Here are ${opts.searchResults.length} relevant links about this ${pathLabelText} path:

${searchResultsText}

${pathStyleHint}

Write a single plain-text response (no markdown, no bullet characters like "-" or "*").

Structure:
- Paragraph 1 must start with "Summary:". In 2–3 short sentences, explain what this ${pathLabelText} path typically looks like for someone in their situation (status ${opts.profile.currentStatus || "not specified"}, stage ${opts.profile.stage || "not specified"}, timeline ${opts.profile.timeline || "not specified"}, interests ${opts.profile.interests || "not specified"}). Mention 1–2 key themes from the links only if they clearly fit.
- Paragraph 2 must start with "Next moves:". In 3–5 concrete actions written as one flowing paragraph, tell them exactly what to do next (types of roles to search, projects to build, resources to read, or people to contact). Where useful, reference specific links by title, for example: "If you want structured micro-internship ideas, start with 'Micro-Internships & Remote Work - Career Education'."

Style rules:
- Use "you" and talk directly to the user.
- Keep the whole answer under 170 words.
- Sentences should be short and punchy (no walls of text).
- No lists, no markdown, no headings beyond the "Summary:" and "Next moves:" labels.
- Keep the tone grounded and realistic, not motivational-poster style.`;

    // Call Gemini REST API (plain text, no JSON mode)
    console.log("[stories] Gemini request", {
      model: GEMINI_MODEL,
      promptLength: prompt.length,
    });

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      let errorJson: unknown = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // Not JSON, use text as-is
      }

      console.warn("[stories] overview Gemini HTTP error", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.slice(0, 2000),
        errorJson: errorJson
          ? JSON.stringify(errorJson, null, 2).slice(0, 1000)
          : null,
      });
      return null;
    }

    let data: {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
        finishReason?: string;
      }>;
      promptFeedback?: {
        blockReason?: string;
      };
    };

    try {
      data = (await response.json()) as typeof data;
    } catch (parseError) {
      console.warn("[stories] overview Gemini JSON parse error", {
        message: parseError instanceof Error ? parseError.message : String(parseError),
        responseText: await response.text().catch(() => "Could not read response"),
      });
      return null;
    }

    // Log full response structure for debugging
    console.log("[stories] Gemini overview response structure", {
      hasCandidates: !!data.candidates,
      candidatesCount: data.candidates?.length ?? 0,
      firstCandidateFinishReason: data.candidates?.[0]?.finishReason,
      promptFeedback: data.promptFeedback,
    });

    if (!data.candidates || data.candidates.length === 0) {
      console.warn("[stories] overview Gemini returned no candidates", {
        fullResponse: JSON.stringify(data, null, 2).slice(0, 1000),
      });
      return null;
    }

    const firstCandidate = data.candidates[0];
    if (!firstCandidate) {
      console.warn("[stories] overview Gemini first candidate is undefined", {
        candidatesCount: data.candidates.length,
      });
      return null;
    }

    if (firstCandidate.finishReason && firstCandidate.finishReason !== "STOP") {
      console.warn("[stories] overview Gemini finish reason", {
        finishReason: firstCandidate.finishReason,
        candidate: JSON.stringify(firstCandidate, null, 2).slice(0, 500),
      });
    }

    const parts = firstCandidate.content?.parts ?? [];
    const combined = parts
      .map((p) => (p.text || "").trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!combined) {
      console.warn("[stories] overview Gemini returned empty content structure", {
        candidatesCount: data.candidates.length,
        firstCandidate: JSON.stringify(firstCandidate, null, 2).slice(0, 800),
        fullResponse: JSON.stringify(data, null, 2).slice(0, 1000),
      });
      return null;
    }

    console.log("[stories] raw Gemini overview (trimmed)", combined.slice(0, 200));
    console.log("[stories] Gemini overview success", {
      length: combined.length,
      finishReason: firstCandidate.finishReason,
    });

    return combined;
  } catch (error) {
    console.warn("[stories] overview Gemini exception", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

// ============================================================================
// NON-AI FALLBACK OVERVIEW HELPER
// ============================================================================

/**
 * Simple non-AI fallback overview, based on profile + Tavily results.
 * Used when Gemini fails, so the user still gets a useful paragraph.
 */
function buildFallbackOverview(opts: {
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
  pathRank: number;
  pathLabel: string;
  searchResults: RawSearchResult[];
}): string {
  const { profile, pathRank, pathLabel, searchResults } = opts;

  const safeLabel =
    pathLabel ||
    (pathRank === 2
      ? "Project & Portfolio Heavy"
      : pathRank === 3
        ? "Unconventional / Cross-Discipline"
        : "Conventional");

  const titles = searchResults
    .map((r) => r.title)
    .filter((t): t is string => !!t && t.trim().length > 0)
    .slice(0, 2);

  // Build Summary paragraph (2-3 sentences)
  const summary = `Summary: For someone in ${profile.currentStatus || "your field"} at the ${profile.stage || "current"} stage, the ${safeLabel} path typically means exploring practical ways to apply your skills over the next ${profile.timeline || "few months"}. This path focuses on ${pathRank === 2 ? "building real projects and portfolio pieces you can showcase" : pathRank === 3 ? "creative combinations of skills and non-linear career moves" : "structured routes like internships, entry-level roles, and well-defined programs"}.`;

  // Build Next moves paragraph (3-5 concrete actions in one flowing paragraph)
  let nextMoves = "Next moves: ";
  const actions: string[] = [];

  if (pathRank === 2) {
    actions.push("pick an industry and design a small sales project", "build a repeatable outreach script", "create a simple CRM or tracking system", "turn your work into portfolio pieces or case studies");
  } else if (pathRank === 3) {
    actions.push("explore hybrid roles that combine multiple fields", "reach out to people in unconventional career paths", "build projects that showcase cross-disciplinary skills", "look for opportunities that value your unique combination of interests");
  } else {
    actions.push("search for entry-level roles and internships in your target field", "build relevant skills through courses or side projects", "reach out to professionals for informational conversations", "apply to structured programs that match your timeline");
  }

  nextMoves += actions.slice(0, 4).join(", ") + ".";

  // Reference a title if available
  if (titles.length > 0) {
    nextMoves += ` If you want specific examples, start with '${titles[0]}'.`;
  }

  return `${summary}\n\n${nextMoves}`;
}

// ============================================================================
// PLACEHOLDER STORY HELPER
// ============================================================================

/**
 * Generate a single placeholder story explaining why stories are unavailable
 */
function getPlaceholderStory(reason: "no-keys" | "no-search-results" | "gemini-failed"): StoryForProfile {
  const placeholders = {
    "no-keys": {
      title: "Stories temporarily unavailable",
      shortSummary: "Real stories require AI and web search keys to be configured.",
      whyItMatches: "Once the AI and search keys are added, this section will be populated with live examples that match your profile.",
    },
    "no-search-results": {
      title: "No stories found for your specific situation",
      shortSummary: "We couldn't find relevant career stories matching your profile through web search.",
      whyItMatches: "Try adjusting your inputs or checking back later. The search may not have found matching content for your unique combination of background, interests, and timeline.",
    },
    "gemini-failed": {
      title: "Story generation temporarily unavailable",
      shortSummary: "We found relevant search results but couldn't process them into personalized stories right now.",
      whyItMatches: "This is usually a temporary issue. Please try again in a few moments.",
    },
  };

  const placeholder = placeholders[reason];

  return {
    id: `placeholder-${reason}`,
    title: placeholder.title,
    sourceUrl: "https://trajectory.app",
    sourceType: "other",
    shortSummary: placeholder.shortSummary,
    whyItMatches: placeholder.whyItMatches,
  };
}

// ============================================================================
// TRPC ROUTER
// ============================================================================

/**
 * Stories Router
 *
 * Provides personalized story recommendations based on user profile.
 * Uses AI (Gemini) + web search (Tavily) when API keys are available,
 * falls back to mock stories otherwise.
 */
export const storiesRouter = createTRPCRouter({
  /**
   * Generate personalized stories for a user profile
   *
   * Uses AI + web search if API keys are available, otherwise returns mock stories.
   * Mock stories are ONLY returned when API keys are missing.
   * When keys are present but the pipeline fails, returns empty array [].
   *
   * Input: profileId (required), pathRank and pathLabel (optional, for path-specific stories)
   * Output: Array of StoryForProfile objects (empty if keys present but pipeline fails)
   */
  generateForProfile: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        pathRank: z.number().optional(),
        pathLabel: z.string().optional(),
      })
    )
    .query(async ({ input }): Promise<StoryForProfile[]> => {
      // Log API key status
      console.log("[stories] env keys", {
        hasGemini: !!env.GEMINI_API_KEY,
        hasWebSearch: !!env.WEB_SEARCH_API_KEY,
      });

      // 1. Load the profile from the database
      const profile = await db.userProfile.findUnique({
        where: { id: input.profileId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Profile with ID "${input.profileId}" not found`,
        });
      }

      // Log loaded profile
      console.log("[stories] loaded profile", {
        id: profile.id,
        currentStatus: profile.currentStatus,
        stage: profile.stage,
        hasInterests: !!profile.interests?.trim(),
        hasExtraInfo: !!profile.extraInfo?.trim(),
      });

      // 2. Check if API keys are available
      const geminiKey = env.GEMINI_API_KEY;
      const webSearchKey = env.WEB_SEARCH_API_KEY;

      // Case A: Keys are missing - return empty array (frontend will handle)
      if (!geminiKey || !webSearchKey) {
        console.warn("[stories] missing API keys, returning empty stories");
        return [];
      }

      // Case B: Keys are present - use Tavily web search + Gemini summarizer
      // 3. Build path-specific modifiers based on which path the user clicked
      const pathRank = input.pathRank ?? 1;
      const pathLabel = input.pathLabel ?? "";

      let pathModifiers: string[] = [];

      if (pathRank === 1 || /conventional/i.test(pathLabel)) {
        // Conventional path → traditional roles, standard routes
        pathModifiers = [
          "traditional career path",
          "industry-standard role",
          "entry level job",
          "internship route",
        ];
      } else if (pathRank === 2 || /project/i.test(pathLabel)) {
        // Project & portfolio heavy → builders, projects, GitHub work
        pathModifiers = [
          "portfolio projects",
          "self-directed projects",
          "open-source contributions",
          "building side projects",
        ];
      } else if (pathRank === 3 || /unconventional|cross-discipline/i.test(pathLabel)) {
        // Unconventional / cross-discipline → hybrid / non-linear paths
        pathModifiers = [
          "unconventional career path",
          "career switch story",
          "nonlinear career",
          "hybrid role combining multiple fields",
        ];
      }

      // 4. Get path-specific keywords
      const keywordsForPath = getKeywordsForPath(pathRank, pathLabel);

      // 5. Build full search query with profile + path context
      const queryParts: string[] = [
        "career story",
        ...pathModifiers,
        ...keywordsForPath,
        profile.currentStatus,
        profile.interests,
        `stage: ${profile.stage}`,
        profile.timeline && `timeline: ${profile.timeline}`,
        profile.extraInfo && `details: ${profile.extraInfo}`,
      ].filter(Boolean) as string[];

      const searchQuery = queryParts.join(" ");
      console.log("[stories] web search query", {
        profileId: profile.id,
        pathRank,
        pathLabel,
        searchQuery,
      });

      // 6. Search the web
      const searchResults = await webSearchForStories({
        query: searchQuery,
        apiKey: webSearchKey,
        limit: 8,
      });

      console.log("[stories] web search results", searchResults.length);

      // 7. Light relevance filter
      const loweredInterest = (profile.interests || "").toLowerCase();
      const loweredStatus = (profile.currentStatus || "").toLowerCase();

      const filteredResults = searchResults.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const snippet = (r.snippet || "").toLowerCase();
        const text = title + " " + snippet;

        // Avoid obviously irrelevant quantum / culinary spam
        if (text.includes("quantum computing") || text.includes("culinary institute")) {
          return false;
        }

        // If we have interests or status, prefer results that at least mention one of them
        if (loweredInterest && !text.includes(loweredInterest) && loweredStatus && !text.includes(loweredStatus)) {
          return true; // we still keep them, just don't filter too aggressively yet
        }

        return true;
      });

      console.log("[stories] web search results (raw vs filtered)", {
        raw: searchResults.length,
        filtered: filteredResults.length,
      });

      if (filteredResults.length === 0) {
        console.warn("[stories] no web search results, returning empty stories");
        return [];
      }

      // 8. Filter for relevance
      const relevanceFilteredResults = filterSearchResultsForRelevance({
        searchResults: filteredResults,
        profile: {
          currentStatus: profile.currentStatus,
          interests: profile.interests,
          timeline: profile.timeline,
          stage: profile.stage,
          extraInfo: profile.extraInfo,
        },
      });

      console.log("[stories] filtered web search results", {
        original: filteredResults.length,
        filtered: relevanceFilteredResults.length,
      });

      if (relevanceFilteredResults.length === 0) {
        console.warn("[stories] no relevant web search results after filtering");
        return [];
      }

      // 9. Select path-specific results
      const selectedResults = selectSearchResultsForPath({
        searchResults: relevanceFilteredResults,
        limit: 4,
        pathRank,
      });

      // 7. Try Gemini summarizer if key exists, otherwise fall back to Tavily-only
      if (!geminiKey) {
        console.warn("[stories] no GEMINI_API_KEY, using Tavily-only summaries");
        const storiesFromSearch = buildStoriesFromSearchResults({
          profile: {
            currentStatus: profile.currentStatus,
            interests: profile.interests,
            timeline: profile.timeline,
            stage: profile.stage,
            extraInfo: profile.extraInfo,
          },
          searchResults: selectedResults,
          limit: 4,
          pathRank,
        });

        if (storiesFromSearch.length === 0) {
          return [];
        }

        // Optional: save to DB
        try {
          await Promise.all(
            storiesFromSearch.map((story) =>
              db.caseStudy.create({
                data: {
                  sourceUrl: story.sourceUrl,
                  sourceType: story.sourceType,
                  title: story.title,
                  shortSummary: story.shortSummary,
                  tags: "tavily-only",
                  stage: profile.stage,
                  fetchedAt: new Date(),
                },
              }).catch((err) => {
                if (err.code !== "P2002") {
                  console.warn("[stories] error - failed to save story to DB", {
                    title: story.title,
                    error: err,
                  });
                }
              })
            )
          );
        } catch (dbError) {
          console.warn("[stories] error - DB save failed", dbError);
        }

        return storiesFromSearch;
      }

      // 8. Call Gemini summarizer
      const aiStories = await generateStoriesWithGemini({
        profile: {
          currentStatus: profile.currentStatus,
          interests: profile.interests,
          timeline: profile.timeline,
          stage: profile.stage,
          extraInfo: profile.extraInfo,
        },
        pathRank,
        pathLabel: input.pathLabel,
        results: selectedResults,
        apiKey: geminiKey,
      });

      // 9. Fallback logic: if Gemini fails, use Tavily-only summaries
      if (aiStories.length === 0) {
        console.warn(
          "[stories] Gemini summarizer returned no stories, falling back to Tavily-only summaries"
        );
        const storiesFromSearch = buildStoriesFromSearchResults({
          profile: {
            currentStatus: profile.currentStatus,
            interests: profile.interests,
            timeline: profile.timeline,
            stage: profile.stage,
            extraInfo: profile.extraInfo,
          },
          searchResults: selectedResults,
          limit: 4,
          pathRank,
        });

        if (storiesFromSearch.length === 0) {
          return [];
        }

        // Optional: save to DB
        try {
          await Promise.all(
            storiesFromSearch.map((story) =>
              db.caseStudy.create({
                data: {
                  sourceUrl: story.sourceUrl,
                  sourceType: story.sourceType,
                  title: story.title,
                  shortSummary: story.shortSummary,
                  tags: "tavily-only-fallback",
                  stage: profile.stage,
                  fetchedAt: new Date(),
                },
              }).catch((err) => {
                if (err.code !== "P2002") {
                  console.warn("[stories] error - failed to save story to DB", {
                    title: story.title,
                    error: err,
                  });
                }
              })
            )
          );
        } catch (dbError) {
          console.warn("[stories] error - DB save failed", dbError);
        }

        return storiesFromSearch;
      }

      // 10. Success: return Gemini-summarized stories
      console.log(
        "[stories] success - returning Tavily-based stories",
        aiStories.length,
      );

      // Optional: save to DB
      try {
        await Promise.all(
          aiStories.map((story) =>
            db.caseStudy.create({
              data: {
                sourceUrl: story.sourceUrl,
                sourceType: story.sourceType,
                title: story.title,
                shortSummary: story.shortSummary,
                tags: "gemini-summarized",
                stage: profile.stage,
                fetchedAt: new Date(),
              },
            }).catch((err) => {
              // Ignore duplicate URL errors (non-fatal)
              if (err.code !== "P2002") {
                console.warn("[stories] error - failed to save story to DB", {
                  title: story.title,
                  error: err,
                });
              }
            })
          )
        );
      } catch (dbError) {
        // Non-fatal: log but don't fail the request
        console.warn("[stories] error - DB save failed", dbError);
      }

      return aiStories;
    }),

  /**
   * Generate an AI-written overview for a user profile and path.
   * Returns a plain text overview summarizing the path and suggesting next steps.
   */
  generateOverviewForProfile: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        pathRank: z.number().optional(),
        pathLabel: z.string().optional(),
      }),
    )
    .query(async ({ input }): Promise<{ overview: string; source: "ai" | "fallback" | "static" }> => {
      // Log API key status
      console.log("[stories] overview env keys", {
        hasGemini: !!env.GEMINI_API_KEY,
        hasWebSearch: !!env.WEB_SEARCH_API_KEY,
      });

      // 1. Load the profile from the database
      const profile = await db.userProfile.findUnique({
        where: { id: input.profileId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Profile with ID "${input.profileId}" not found`,
        });
      }

      // 2. Check if API keys are available
      const geminiKey = env.GEMINI_API_KEY;
      const webSearchKey = env.WEB_SEARCH_API_KEY;

      // If keys are missing, return fallback overview
      if (!geminiKey || !webSearchKey) {
        console.warn("[stories] overview missing API keys, using fallback");
        return {
          overview:
            "AI overview is temporarily unavailable for this path right now, but you can still explore the links below for real examples.",
          source: "static",
        };
      }

      // 3. Build path-specific modifiers (same logic as generateForProfile)
      const pathRank = input.pathRank ?? 1;
      const pathLabel = input.pathLabel ?? "";

      let pathModifiers: string[] = [];

      if (pathRank === 1 || /conventional/i.test(pathLabel)) {
        pathModifiers = [
          "traditional career path",
          "industry-standard role",
          "entry level job",
          "internship route",
        ];
      } else if (pathRank === 2 || /project/i.test(pathLabel)) {
        pathModifiers = [
          "portfolio projects",
          "self-directed projects",
          "open-source contributions",
          "building side projects",
        ];
      } else if (pathRank === 3 || /unconventional|cross-discipline/i.test(pathLabel)) {
        pathModifiers = [
          "unconventional career path",
          "career switch story",
          "nonlinear career",
          "hybrid role combining multiple fields",
        ];
      }

      // 4. Get path-specific keywords
      const keywordsForPath = getKeywordsForPath(pathRank, pathLabel);

      // 5. Build full search query with profile + path context
      const queryParts: string[] = [
        "career story",
        ...pathModifiers,
        ...keywordsForPath,
        profile.currentStatus,
        profile.interests,
        `stage: ${profile.stage}`,
        profile.timeline && `timeline: ${profile.timeline}`,
        profile.extraInfo && `details: ${profile.extraInfo}`,
      ].filter(Boolean) as string[];

      const searchQuery = queryParts.join(" ");
      console.log("[stories] overview web search query", {
        profileId: profile.id,
        pathRank,
        pathLabel,
        searchQuery,
      });

      // 5. Search the web
      const searchResults = await webSearchForStories({
        query: searchQuery,
        apiKey: webSearchKey,
        limit: 6,
      });

      if (searchResults.length === 0) {
        console.warn("[stories] overview no web search results, using fallback");
        return {
          overview:
            "AI overview is temporarily unavailable for this path right now, but you can still explore the links below for real examples.",
          source: "static",
        };
      }

      // 5.5. Filter for relevance
      const filteredResults = filterSearchResultsForRelevance({
        searchResults,
        profile: {
          currentStatus: profile.currentStatus,
          interests: profile.interests,
          timeline: profile.timeline,
          stage: profile.stage,
          extraInfo: profile.extraInfo,
        },
      });

      console.log("[stories] overview filtered web search results", {
        original: searchResults.length,
        filtered: filteredResults.length,
      });

      if (filteredResults.length === 0) {
        console.warn("[stories] overview has no relevant web search results after filtering");
        return {
          overview:
            "AI overview is temporarily unavailable for this path right now because we couldn't find relevant real-world examples. Try adjusting your inputs or path and generating again.",
          source: "static",
        };
      }

      // 6. Take top 4-6 results for overview
      const topResults = filteredResults.slice(0, Math.min(6, filteredResults.length));

      // 7. Call Gemini for overview
      const overview = await generatePathOverviewWithGemini({
        profile: {
          currentStatus: profile.currentStatus,
          interests: profile.interests,
          timeline: profile.timeline,
          stage: profile.stage,
          extraInfo: profile.extraInfo,
        },
        pathRank,
        pathLabel: input.pathLabel,
        searchResults: topResults,
        apiKey: geminiKey,
      });

      if (!overview) {
        console.warn(
          "[stories] overview Gemini returned null, using non-AI fallback overview"
        );
        const fallbackOverview = buildFallbackOverview({
          profile: {
            currentStatus: profile.currentStatus,
            interests: profile.interests,
            timeline: profile.timeline,
            stage: profile.stage,
            extraInfo: profile.extraInfo,
          },
          pathRank,
          pathLabel,
          searchResults: topResults,
        });

        return { overview: fallbackOverview, source: "fallback" };
      }

      console.log("[stories] overview success");
      return { overview, source: "ai" };
    }),
});
