import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export interface Path {
  id: string;
  name: string;
  description: string;
}

// Mock paths data
const mockPaths: Path[] = [
  {
    id: "swe",
    name: "Software Engineering",
    description: "Projects, problem solving, and building products as a SWE or intern.",
  },
  {
    id: "biz-product",
    name: "Business / Product",
    description: "Blending business thinking, analytics, and product roles.",
  },
  {
    id: "construction-tech",
    name: "Construction-Tech Hybrid",
    description: "Combining technical tools with construction or field operations.",
  },
];

export const pathsRouter = createTRPCRouter({
  getAll: publicProcedure.query(() => {
    return mockPaths;
  }),
});

