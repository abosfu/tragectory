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
// GEMINI AI HELPER
// ============================================================================

/**
 * Use Gemini AI to generate personalized stories from search results
 * Returns empty array on any error (caller should handle fallback)
 */
async function generateStoriesWithGemini(opts: {
  profile: {
    currentStatus: string;
    interests: string;
    timeline: string;
    stage: string;
    extraInfo?: string | null;
  };
  searchResults: RawSearchResult[];
  apiKey: string;
}): Promise<StoryForProfile[]> {
  try {
    // Build search results text for prompt
    const searchResultsText = opts.searchResults
      .map(
        (r, i) =>
          `${i + 1}. Title: ${r.title}\n   URL: ${r.url}\n   ${r.snippet ? `Snippet: ${r.snippet}\n` : ""}`
      )
      .join("\n\n");

    // Build prompt asking for strict JSON output
    const prompt = `You are a career advisor helping someone find relevant career transition stories.

User Profile:
- Current Status: ${opts.profile.currentStatus}
- Interests: ${opts.profile.interests}
- Timeline: ${opts.profile.timeline}
- Stage: ${opts.profile.stage}
${opts.profile.extraInfo ? `- Extra Context: ${opts.profile.extraInfo}` : ""}

Here are ${opts.searchResults.length} search results about career transitions:

${searchResultsText}

Your task:
1. Select the 3-5 BEST stories that match this user's situation
2. For each story, infer the sourceType from the URL:
   - "video" if URL contains youtube.com, youtu.be, vimeo.com, or similar video platforms
   - "linkedin" if URL contains linkedin.com
   - "article" for blog posts, Medium, news sites, etc.
   - "other" for anything else
3. Generate a shortSummary (2-4 sentences) explaining the story
4. Generate a whyItMatches (1-2 sentences) explaining why this story is relevant to THIS specific user

Return ONLY valid JSON in this exact format (no markdown, no code blocks, no explanations):
[
  {
    "id": "story-1",
    "title": "Story title here",
    "sourceUrl": "https://...",
    "sourceType": "article",
    "shortSummary": "2-4 sentence summary...",
    "whyItMatches": "Why this matches the user..."
  }
]

Make sure sourceType is one of: "video", "article", "linkedin", "other".`;

    // Call Gemini REST API
    // Try v1beta with gemini-1.5-flash-latest (more stable)
    // If this fails, the error will be logged and we'll return []
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${opts.apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      console.warn("[stories] error - Gemini API HTTP error", {
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
      console.warn("[stories] error - Gemini returned empty response");
      return [];
    }

    console.log("[stories] raw Gemini output (trimmed)", rawText.slice(0, 300));

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = rawText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    
    // Try to find JSON array in the text (in case there's extra text)
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let stories: StoryForProfile[];
    try {
      stories = JSON.parse(jsonText) as StoryForProfile[];
    } catch (parseError) {
      console.warn("[stories] error - JSON parse failed", {
        message: parseError instanceof Error ? parseError.message : String(parseError),
        jsonPreview: jsonText.slice(0, 200),
      });
      return [];
    }

    // Validate it's an array
    if (!Array.isArray(stories)) {
      console.warn("[stories] error - Gemini returned non-array response");
      return [];
    }

    console.log("[stories] parsed Gemini stories", stories.length);

    // Validate and filter stories - ensure required fields and valid sourceType
    const validStories = stories
      .filter((s) => {
        if (!s.id || !s.title || !s.sourceUrl || !s.shortSummary || !s.whyItMatches) {
          return false;
        }
        
        // Infer sourceType from URL if not provided or invalid
        if (!s.sourceType || !["video", "article", "linkedin", "other"].includes(s.sourceType)) {
          const url = s.sourceUrl.toLowerCase();
          if (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com")) {
            s.sourceType = "video";
          } else if (url.includes("linkedin.com")) {
            s.sourceType = "linkedin";
          } else {
            s.sourceType = "article";
          }
        }
        
        return true;
      })
      .map((s) => ({
        id: s.id!,
        title: s.title!,
        sourceUrl: s.sourceUrl!,
        sourceType: s.sourceType as "video" | "article" | "linkedin" | "other",
        shortSummary: s.shortSummary!,
        whyItMatches: s.whyItMatches!,
      }));

    return validStories;
  } catch (error) {
    console.warn("[stories] error - Gemini generation exception", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
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

      // Case A: Keys are missing - return placeholder story
      if (!geminiKey || !webSearchKey) {
        console.warn("[stories] missing API keys, using fallback story");
        return [getPlaceholderStory("no-keys")];
      }

      // Case B: Keys are present - use real AI pipeline
      // 3. Build search query from profile + optional path context
      const queryParts: string[] = [
        "career story",
        profile.currentStatus,
        profile.interests,
        `stage: ${profile.stage}`,
        profile.timeline && `timeline: ${profile.timeline}`,
        profile.extraInfo && `details: ${profile.extraInfo}`,
      ].filter(Boolean) as string[];

      const searchQuery = queryParts.join(" | ");
      console.log("[stories] web search query", searchQuery);

      // 4. Search the web
      const searchResults = await webSearchForStories({
        query: searchQuery,
        apiKey: webSearchKey,
        limit: 8,
      });

      console.log("[stories] web search results", searchResults.length);

      if (searchResults.length === 0) {
        console.warn("[stories] no web search results, using fallback story");
        return [getPlaceholderStory("no-search-results")];
      }

      // 5. Generate stories with Gemini
      console.log("[stories] calling Gemini", {
        currentStatus: profile.currentStatus,
        interests: profile.interests,
        timeline: profile.timeline,
        stage: profile.stage,
        extraInfo: profile.extraInfo,
        searchResultsCount: searchResults.length,
      });

      const aiStories = await generateStoriesWithGemini({
        profile: {
          currentStatus: profile.currentStatus,
          interests: profile.interests,
          timeline: profile.timeline,
          stage: profile.stage,
          extraInfo: profile.extraInfo,
        },
        searchResults,
        apiKey: geminiKey,
      });

      if (aiStories.length === 0) {
        console.warn("[stories] Gemini returned no stories, using fallback story");
        return [getPlaceholderStory("gemini-failed")];
      }

      console.log("[stories] success - returning", aiStories.length, "stories");

      // 6. (Optional) Store successful stories in CaseStudy table for historical tracking
      try {
        await Promise.all(
          aiStories.map((story) =>
            db.caseStudy.create({
              data: {
                sourceUrl: story.sourceUrl,
                sourceType: story.sourceType,
                title: story.title,
                shortSummary: story.shortSummary,
                tags: "ai-ingested",
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
});
