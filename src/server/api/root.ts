import { pathsRouter } from "~/server/api/routers/paths";
import { caseStudiesRouter } from "~/server/api/routers/caseStudies";
import { profileRouter } from "~/server/api/routers/profile";
import { recommendationRouter } from "~/server/api/routers/recommendation";
import { storiesRouter } from "~/server/api/routers/stories";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // Existing routers (mock data for UI)
  paths: pathsRouter,
  caseStudies: caseStudiesRouter,

  // DB-backed routers
  profile: profileRouter,
  recommendation: recommendationRouter,
  stories: storiesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.paths.getAll();
 *       ^? Path[]
 */
export const createCaller = createCallerFactory(appRouter);
