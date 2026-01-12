import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

/**
 * Profile Router
 * 
 * Handles user profile creation and retrieval.
 * These profiles store the user's background info from the home form.
 */
export const profileRouter = createTRPCRouter({
  /**
   * Create a new user profile
   * 
   * Input: User's background information from the home form
   * Output: The created profile with id, currentStatus, and stage
   */
  createProfile: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        currentStatus: z.string().min(1, "Current status is required"),
        interests: z.string().min(1, "Interests are required"),
        location: z.string().optional(),
        timeline: z.string().min(1, "Timeline is required"),
        stage: z.enum(["Student", "NewGrad", "CareerSwitch", "MidCareer"]),
        extraInfo: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const profile = await db.userProfile.create({
        data: {
          name: input.name,
          currentStatus: input.currentStatus,
          interests: input.interests,
          location: input.location,
          timeline: input.timeline,
          stage: input.stage,
          extraInfo: input.extraInfo,
        },
      });

      return {
        id: profile.id,
        currentStatus: profile.currentStatus,
        stage: profile.stage,
      };
    }),

  /**
   * Get a user profile by ID
   * 
   * Input: Profile ID
   * Output: Full profile data or null if not found
   */
  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const profile = await db.userProfile.findUnique({
        where: { id: input.id },
        include: {
          paths: {
            orderBy: { rank: "asc" },
          },
        },
      });

      return profile;
    }),
});

