"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "~/trpc/react";

// Helper function to render nice labels for stage
function formatStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    Student: "Student",
    NewGrad: "New grad",
    CareerSwitch: "Career switch",
    MidCareer: "Mid-career",
  };
  return labels[stage] ?? stage;
}

export default function ResultsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = use(params);

  // Fetch profile and paths data
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = api.profile.getProfile.useQuery({ id: profileId });

  const {
    data: paths,
    isLoading: pathsLoading,
    error: pathsError,
  } = api.recommendation.getPathsForProfile.useQuery({ profileId });

  const isLoading = profileLoading || pathsLoading;
  const hasError = profileError || pathsError;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-500">Loading your paths...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (hasError || !profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h2
              className="text-2xl font-medium text-black mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Profile not found
            </h2>
            <p className="text-neutral-500 mb-6">
              We couldn't find this profile. It may have been deleted or the link is incorrect.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-black text-white hover:bg-neutral-800 h-10 px-6 text-sm font-medium rounded-lg transition-colors"
            >
              ← Start over
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Empty paths state
  if (!paths || paths.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <ProfileSummary profile={profile} />
            <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
              <h3
                className="text-xl font-medium text-black mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                No paths generated yet
              </h3>
              <p className="text-neutral-500 mb-6">
                Something went wrong generating your paths. Please try again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-black text-white hover:bg-neutral-800 h-10 px-6 text-sm font-medium rounded-lg transition-colors"
              >
                ← Try again
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state with paths
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Page Header */}
          <div className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-neutral-500 hover:text-black mb-6 transition-colors group"
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
                Start new exploration
              </span>
            </Link>

            <div
              className="inline-block text-xs tracking-[0.2em] uppercase text-neutral-500 px-3 py-1.5 bg-neutral-100 rounded-full mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Your Results
            </div>
            <h1
              className="text-3xl lg:text-4xl text-black font-medium leading-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your possible trajectories
            </h1>
            <p className="text-neutral-500 text-base leading-relaxed max-w-2xl">
              Based on your background and interests, here are three possible
              career directions you could explore.
            </p>
          </div>

          {/* Profile Summary */}
          <ProfileSummary profile={profile} />

          {/* Paths List */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-medium text-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Recommended Paths
              </h2>
              <span className="text-sm text-neutral-400">
                {paths.length} {paths.length === 1 ? "path" : "paths"}
              </span>
            </div>

            <div className="space-y-4">
              {paths.map((path, index) => (
                <div
                  key={path.id}
                  className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank badge */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-black"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <h3
                        className="text-lg font-medium text-black mb-2"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {path.aiLabel}
                      </h3>

                      {/* Target role/industry tags */}
                      {(path.targetRole || path.targetIndustry) && (
                        <div
                          className="flex flex-wrap gap-2 text-xs text-neutral-500 mb-3"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {path.targetRole && (
                            <span className="bg-neutral-100 px-2 py-1 rounded">
                              {path.targetRole}
                            </span>
                          )}
                          {path.targetIndustry && (
                            <span className="bg-neutral-100 px-2 py-1 rounded">
                              {path.targetIndustry}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-neutral-600 leading-relaxed mb-4">
                        {path.aiExplanation}
                      </p>

                      <Link
                        href={`/results/${profileId}/paths/${path.rank}`}
                        className="inline-flex items-center text-sm text-neutral-600 hover:text-black transition-colors mt-2"
                      >
                        <span
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="tracking-wide"
                        >
                          View real stories
                        </span>
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
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA to explore more */}
          <div className="mt-12 p-6 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
            <p className="text-neutral-500 text-sm mb-4">
              Want to see real case studies for these paths?
            </p>
            <Link
              href="/paths"
              className="inline-flex items-center justify-center bg-black text-white hover:bg-neutral-800 h-10 px-6 text-sm font-medium rounded-lg transition-colors"
            >
              Browse all paths →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Profile Summary Component
function ProfileSummary({
  profile,
}: {
  profile: {
    currentStatus: string;
    timeline: string;
    stage: string;
    interests: string;
    name?: string | null;
    location?: string | null;
    extraInfo?: string | null;
  };
}) {
  return (
    <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
      <h3
        className="text-sm font-medium text-neutral-500 mb-4 uppercase tracking-wide"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Your Profile
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-neutral-400 mb-1">Current Status</p>
          <p className="text-sm text-black font-medium">{profile.currentStatus}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Timeline</p>
          <p className="text-sm text-black font-medium">{profile.timeline}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Stage</p>
          <p className="text-sm text-black font-medium">{formatStageLabel(profile.stage)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1">Interests</p>
          <p className="text-sm text-black font-medium line-clamp-2">
            {profile.interests}
          </p>
        </div>
      </div>
      {profile.extraInfo && profile.extraInfo.trim() && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-400 mb-1">Extra Context</p>
          <p className="text-sm text-black">{profile.extraInfo}</p>
        </div>
      )}
    </div>
  );
}

// Header Component
function Header() {
  return (
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
  );
}

// Footer Component
function Footer() {
  return (
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
  );
}
