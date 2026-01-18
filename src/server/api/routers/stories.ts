import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

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
 * Stories Router
 *
 * Provides personalized story recommendations based on user profile.
 *
 * CURRENT STATE: Returns mock stories for development/testing.
 * FUTURE STATE: Will integrate with AI and web search to find real stories.
 *
 * // TODO: Future implementation will require:
 * // - GEMINI_API_KEY env var for Google's Generative AI
 * //   Used to: analyze profile, generate search queries, summarize content
 * // - WEB_SEARCH_API_KEY (e.g., SerpAPI, Google Custom Search, or similar)
 * //   Used to: search YouTube, LinkedIn, blogs for relevant stories
 * // - YOUTUBE_API_KEY (optional, for richer video metadata)
 * //   Used to: fetch video details, transcripts for better summaries
 *
 * // TODO: Future flow:
 * // 1. Load user profile from DB
 * // 2. Use Gemini to generate targeted search queries based on profile
 * // 3. Call web search API to find relevant YouTube videos, LinkedIn posts, blog articles
 * // 4. For each result, use Gemini to:
 * //    - Generate a concise summary
 * //    - Explain why it matches this specific user's situation
 * // 5. Return top N most relevant stories
 * // 6. Optionally cache results in CaseStudy table for future use
 */
export const storiesRouter = createTRPCRouter({
  /**
   * Generate personalized stories for a user profile
   *
   * CURRENT: Returns mock stories tied to profile data.
   * FUTURE: Will call Gemini + web search APIs to find real stories.
   *
   * Input: profileId - The ID of the UserProfile
   * Output: Array of StoryForProfile objects
   */
  generateForProfile: publicProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ input }): Promise<StoryForProfile[]> => {
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

      // 2. For now, return MOCK stories shaped like future AI results
      //
      // TODO: Replace this mock data with real AI + search implementation:
      // - Use Gemini to analyze profile.currentStatus, profile.interests,
      //   profile.stage, profile.timeline, profile.extraInfo
      // - Generate search queries like:
      //   "[profile.interests] career transition story"
      //   "[profile.currentStatus] to [target role] journey"
      // - Call web search API (YouTube, LinkedIn, blogs)
      // - Use Gemini to summarize each result and explain relevance
      // - Filter and rank by relevance to this specific profile

      const mockStories: StoryForProfile[] = [
        {
          id: "mock-1",
          title: "CS + Sales: building a hybrid path",
          sourceUrl: "https://example.com/story-1",
          sourceType: "article",
          shortSummary:
            "A student mixing technical CS skills with sales experience to break into tech sales / solutions engineering.",
          whyItMatches: `Relates to your current status ("${profile.currentStatus}") and interests ("${profile.interests}").`,
        },
        {
          id: "mock-2",
          title: "From confused student to clear 12-month plan",
          sourceUrl: "https://example.com/story-2",
          sourceType: "video",
          shortSummary:
            "Someone unsure about direction who used small experiments and projects to converge on a path.",
          whyItMatches: `Speaks to your timeline ("${profile.timeline}")${profile.extraInfo ? ` and the context you shared about "${profile.extraInfo.slice(0, 50)}..."` : ""}.`,
        },
        {
          id: "mock-3",
          title: "Breaking into tech without a CS degree",
          sourceUrl: "https://example.com/story-3",
          sourceType: "linkedin",
          shortSummary:
            "A non-traditional path into software engineering through bootcamps, self-study, and strategic networking.",
          whyItMatches: `Relevant for someone at the "${profile.stage}" stage exploring "${profile.interests}".`,
        },
      ];

      return mockStories;
    }),
});

