import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

// ============================================================================
// MOCK DATA (kept for existing UI compatibility)
// ============================================================================

export interface MockCaseStudy {
  id: string;
  title: string;
  roleType: string;
  tags: string[];
  shortSummary: string;
  url: string;
}

// Mock case studies data by pathId - DO NOT MODIFY
// This data is used by the existing /paths/[pathId] page
const mockCaseStudies: Record<string, MockCaseStudy[]> = {
  swe: [
    {
      id: "swe-1",
      title: "From part-time retail to SWE intern",
      roleType: "SWE Intern",
      tags: ["self-taught projects", "networking"],
      shortSummary:
        "How a student built 2 portfolio projects and used targeted networking to land a SWE internship.",
      url: "https://example.com/case-study-swe-1",
    },
    {
      id: "swe-2",
      title: "Breaking into tech from non-CS background",
      roleType: "Junior Developer",
      tags: ["bootcamp", "side projects", "open source"],
      shortSummary:
        "A biology major who transitioned to software development through a coding bootcamp and consistent open source contributions.",
      url: "https://example.com/case-study-swe-2",
    },
    {
      id: "swe-3",
      title: "From QA tester to full-stack engineer",
      roleType: "Full-Stack Engineer",
      tags: ["internal mobility", "continuous learning"],
      shortSummary:
        "How a quality assurance tester upskilled through online courses and internal transfers to become a full-stack engineer.",
      url: "https://example.com/case-study-swe-3",
    },
  ],
  "biz-product": [
    {
      id: "biz-1",
      title: "Liberal arts to product management",
      roleType: "Associate PM",
      tags: ["customer research", "cross-functional"],
      shortSummary:
        "An English major who leveraged strong communication skills and customer empathy to transition into product management.",
      url: "https://example.com/case-study-biz-1",
    },
    {
      id: "biz-2",
      title: "Engineering to product strategy",
      roleType: "Product Manager",
      tags: ["technical background", "business strategy"],
      shortSummary:
        "A software engineer who moved into product management by building strong business acumen and strategic thinking.",
      url: "https://example.com/case-study-biz-2",
    },
    {
      id: "biz-3",
      title: "Consulting to tech product ops",
      roleType: "Product Operations",
      tags: ["process optimization", "analytics"],
      shortSummary:
        "How a management consultant transitioned to tech by focusing on data-driven decision making and operational excellence.",
      url: "https://example.com/case-study-biz-3",
    },
  ],
  "construction-tech": [
    {
      id: "const-1",
      title: "From field engineer to construction software PM",
      roleType: "Product Manager",
      tags: ["domain expertise", "technical skills"],
      shortSummary:
        "A civil engineer who combined field experience with software knowledge to build products for the construction industry.",
      url: "https://example.com/case-study-const-1",
    },
    {
      id: "const-2",
      title: "Architecture to PropTech development",
      roleType: "Full-Stack Developer",
      tags: ["design thinking", "coding bootcamp"],
      shortSummary:
        "An architect who learned to code and now builds technology solutions for real estate and construction challenges.",
      url: "https://example.com/case-study-const-2",
    },
    {
      id: "const-3",
      title: "Project manager to construction data analyst",
      roleType: "Data Analyst",
      tags: ["data visualization", "industry knowledge"],
      shortSummary:
        "How a construction project manager leveraged industry insights to transition into a data-focused role in construction tech.",
      url: "https://example.com/case-study-const-3",
    },
  ],
};

// ============================================================================
// TRPC ROUTER
// ============================================================================

export const caseStudiesRouter = createTRPCRouter({
  // ==========================================================================
  // MOCK PROCEDURE (existing - DO NOT MODIFY)
  // Used by: /paths/[pathId]/page.tsx
  // ==========================================================================

  /**
   * Get mock case studies by path ID
   * @deprecated This uses mock data. Use listRecent for DB-backed data.
   */
  getByPath: publicProcedure
    .input(z.object({ pathId: z.string() }))
    .query(({ input }) => {
      return mockCaseStudies[input.pathId] ?? [];
    }),

  // ==========================================================================
  // DB-BACKED PROCEDURES (new - for future use)
  // ==========================================================================

  /**
   * Manually create a case study in the database
   * 
   * Use this to seed case studies or for admin functionality.
   * In the future, we'll have automated ingestion from YouTube/blogs/etc.
   * 
   * // TODO: When we add AI ingestion, we'll need:
   * // - GEMINI_API_KEY for summarization
   * // - YOUTUBE_API_KEY for video metadata (optional)
   */
  createManual: publicProcedure
    .input(
      z.object({
        sourceUrl: z.string().url("Must be a valid URL"),
        sourceType: z.enum(["video", "article", "linkedin", "other"]),
        title: z.string().min(1, "Title is required"),
        roleType: z.string().optional(),
        stage: z.enum(["Student", "NewGrad", "CareerSwitch", "MidCareer"]).optional(),
        tags: z.string().optional(),
        shortSummary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const caseStudy = await db.caseStudy.create({
        data: {
          sourceUrl: input.sourceUrl,
          sourceType: input.sourceType,
          title: input.title,
          roleType: input.roleType,
          stage: input.stage,
          tags: input.tags,
          shortSummary: input.shortSummary,
          fetchedAt: new Date(),
        },
      });

      return caseStudy;
    }),

  /**
   * List recent case studies from the database
   * 
   * Supports optional filtering by roleType and stage.
   * Returns results ordered by most recently fetched/created.
   */
  listRecent: publicProcedure
    .input(
      z
        .object({
          roleType: z.string().optional(),
          stage: z.string().optional(),
          limit: z.number().min(1).max(100).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 20;

      const caseStudies = await db.caseStudy.findMany({
        where: {
          ...(input?.roleType && { roleType: input.roleType }),
          ...(input?.stage && { stage: input.stage }),
        },
        orderBy: [
          { fetchedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: limit,
      });

      return caseStudies;
    }),
});
