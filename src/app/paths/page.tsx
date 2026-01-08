"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export default function PathsPage() {
  const { data: paths, isLoading } = api.paths.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-neutral-500">Loading...</div>
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
              <span className="text-sm text-black font-medium">Paths</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Page Header */}
          <div className="mb-12">
            <div
              className="inline-block text-xs tracking-[0.2em] uppercase text-neutral-500 px-3 py-1.5 bg-neutral-100 rounded-full mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Available Paths
            </div>
            <h1
              className="text-3xl lg:text-4xl text-black font-medium leading-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Choose a direction to explore.
            </h1>
            <p className="text-neutral-500 text-base leading-relaxed max-w-2xl">
              Each path includes real case studies from people who successfully
              navigated similar career transitions. Compare their journeys to
              find what resonates with you.
            </p>
          </div>

          {/* Paths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths?.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.id}`}
                className="group bg-white border border-neutral-200 rounded-xl p-6 hover:border-black hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-5 group-hover:bg-neutral-200 transition-colors">
                  <svg
                    className="w-6 h-6 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
                <h2
                  className="text-xl mb-2 text-black font-medium"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {path.name}
                </h2>
                <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                  {path.description}
                </p>
                <div
                  className="flex items-center text-sm text-black group-hover:translate-x-1 transition-transform"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className="tracking-wide">View case studies</span>
                  <svg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </Link>
            ))}
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
