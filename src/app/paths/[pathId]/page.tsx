"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "~/trpc/react";

export default function PathDetailPage({
  params,
}: {
  params: Promise<{ pathId: string }>;
}) {
  const { pathId } = use(params);
  const { data: paths } = api.paths.getAll.useQuery();
  const { data: caseStudies, isLoading } = api.caseStudies.getByPath.useQuery({
    pathId,
  });

  const currentPath = paths?.find((p) => p.id === pathId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Path not found</p>
          <Link href="/paths" className="text-black underline">
            Back to paths
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="text-sm tracking-[0.25em] uppercase text-black font-medium hover:opacity-70 transition-opacity"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TRAJECTORY
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Home
              </Link>
              <Link
                href="/paths"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                Paths
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Back Link */}
          <Link
            href="/paths"
            className="inline-flex items-center text-sm text-neutral-500 hover:text-black mb-8 transition-colors group"
          >
            <svg
              className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            <span
              style={{ fontFamily: "var(--font-mono)" }}
              className="tracking-wide"
            >
              Back to all paths
            </span>
          </Link>

          {/* Page Header */}
          <div className="mb-12 pb-8 border-b border-neutral-200">
            <div
              className="inline-block text-xs tracking-[0.2em] uppercase text-neutral-500 px-3 py-1.5 bg-neutral-100 rounded-full mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Career Path
            </div>
            <h1
              className="text-3xl lg:text-4xl text-black font-medium leading-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {currentPath.name}
            </h1>
            <p className="text-neutral-500 text-base leading-relaxed max-w-2xl">
              {currentPath.description}
            </p>
          </div>

          {/* Case Studies Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-medium text-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Case Studies
              </h2>
              <span className="text-sm text-neutral-400">
                {caseStudies?.length ?? 0} stories
              </span>
            </div>

            <div className="space-y-4">
              {caseStudies?.map((study) => (
                <div
                  key={study.id}
                  className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3
                        className="text-lg mb-2 text-black font-medium"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {study.title}
                      </h3>

                      <div
                        className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-4"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        <span className="bg-neutral-100 px-2 py-1 rounded">
                          {study.roleType}
                        </span>
                        {study.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-neutral-100 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {study.shortSummary}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-black hover:underline group"
                    >
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className="tracking-wide"
                      >
                        Read full case study
                      </span>
                      <svg
                        className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              ))}

              {caseStudies?.length === 0 && (
                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
                  <p className="text-neutral-500">
                    No case studies available for this path yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div
              className="text-xs tracking-[0.2em] uppercase text-neutral-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TRAJECTORY
            </div>
            <p className="text-sm text-neutral-400">
              Explore your career possibilities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
