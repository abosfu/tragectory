import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export interface CaseStudy {
  id: string;
  title: string;
  roleType: string;
  tags: string[];
  shortSummary: string;
  url: string;
}

// Mock case studies data by pathId
const mockCaseStudies: Record<string, CaseStudy[]> = {
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

export const caseStudiesRouter = createTRPCRouter({
  getByPath: publicProcedure
    .input(z.object({ pathId: z.string() }))
    .query(({ input }) => {
      return mockCaseStudies[input.pathId] ?? [];
    }),
});

