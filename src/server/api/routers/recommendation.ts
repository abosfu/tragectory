import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

/**
 * Recommendation Router
 * 
 * Handles AI-powered path recommendations for user profiles.
 * 
 * CURRENT STATE: Skeleton implementation with placeholder data.
 * FUTURE STATE: Will integrate with Gemini AI to generate personalized paths.
 * 
 * // TODO: When we add AI integration, we'll need:
 * // - GEMINI_API_KEY env var for Google's Generative AI
 * // - Prompt templates for path generation
 * // - Rate limiting / caching to manage API costs
 */
export const recommendationRouter = createTRPCRouter({
  /**
   * Generate career paths for a user profile
   * 
   * CURRENT: Creates 3 placeholder paths without AI.
   * FUTURE: Will call Gemini API to generate personalized recommendations
   *         based on the user's currentStatus, interests, stage, etc.
   * 
   * Input: profileId - The ID of the UserProfile to generate paths for
   * Output: Array of created UserPathSelection records
   */
  generatePathsForProfile: publicProcedure
    .input(z.object({ profileId: z.string() }))
    .mutation(async ({ input }) => {
      // 1. Load the user profile
      const profile = await db.userProfile.findUnique({
        where: { id: input.profileId },
      });

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Profile with ID "${input.profileId}" not found`,
        });
      }

      // 2. Delete any existing paths for this profile (regenerating)
      await db.userPathSelection.deleteMany({
        where: { userProfileId: input.profileId },
      });

      // 3. Generate placeholder paths based on profile
      // TODO: Replace this with actual Gemini AI call
      // The AI should consider: profile.currentStatus, profile.interests,
      // profile.stage, profile.timeline, profile.extraInfo
      
      const placeholderPaths = [
        {
          userProfileId: input.profileId,
          aiLabel: "Conventional Path",
          aiExplanation: `Based on your background as "${profile.currentStatus}", this path follows a traditional trajectory in your field. It emphasizes building core skills and gaining experience through established channels.`,
          targetRole: "Industry Standard Role",
          targetIndustry: null,
          rank: 1,
        },
        {
          userProfileId: input.profileId,
          aiLabel: "Project & Portfolio Heavy",
          aiExplanation: `Given your interests in "${profile.interests}", this path focuses on building a strong portfolio of personal projects and open-source contributions to demonstrate your capabilities.`,
          targetRole: "Self-Directed Builder",
          targetIndustry: null,
          rank: 2,
        },
        {
          userProfileId: input.profileId,
          aiLabel: "Unconventional / Cross-Discipline",
          aiExplanation: `For someone at the "${profile.stage}" stage with your timeline of "${profile.timeline}", this path explores non-traditional routes that combine multiple domains or leverage transferable skills.`,
          targetRole: "Hybrid Role",
          targetIndustry: null,
          rank: 3,
        },
      ];

      // 4. Create the paths in the database
      const createdPaths = await Promise.all(
        placeholderPaths.map((path) =>
          db.userPathSelection.create({
            data: path,
          })
        )
      );

      return createdPaths;
    }),

  /**
   * Get all paths for a user profile
   * 
   * Returns the previously generated paths ordered by rank.
   * If no paths exist, returns an empty array (caller should call
   * generatePathsForProfile first).
   * 
   * Input: profileId - The ID of the UserProfile
   * Output: Array of UserPathSelection records ordered by rank
   */
  getPathsForProfile: publicProcedure
    .input(z.object({ profileId: z.string() }))
    .query(async ({ input }) => {
      const paths = await db.userPathSelection.findMany({
        where: { userProfileId: input.profileId },
        orderBy: { rank: "asc" },
      });

      return paths;
    }),
});

