"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "~/trpc/react";
import type { StoryForProfile } from "~/server/api/routers/stories";

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

export default function PathDetailPage({
  params,
}: {
  params: Promise<{ profileId: string; rank: string }>;
}) {
  const { profileId, rank } = use(params);
  const rankNumber = Number(rank);

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

  const selectedPath = paths?.find((p) => p.rank === rankNumber);

  // Fetch stories once profile and paths are loaded
  const {
    data: stories,
    isLoading: storiesLoading,
    error: storiesError,
  } = api.stories.generateForProfile.useQuery(
    {
      profileId,
      pathRank: rankNumber,
      pathLabel: selectedPath?.aiLabel,
    },
    {
      enabled: !!profile && !!paths && !Number.isNaN(rankNumber) && !!selectedPath,
    }
  );

  // Fetch overview once profile and paths are loaded
  const {
    data: overviewData,
    isLoading: overviewLoading,
  } = api.stories.generateOverviewForProfile.useQuery(
    {
      profileId,
      pathRank: rankNumber,
      pathLabel: selectedPath?.aiLabel,
    },
    {
      enabled: !!profile && !!paths && !Number.isNaN(rankNumber) && !!selectedPath,
    }
  );

  const isLoading = profileLoading || pathsLoading;
  const hasError = profileError || pathsError;

  // Overview is now always shown if it exists (handled in the render)

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-neutral-500">Loading path...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error / Not found state
  if (hasError || !profile || !selectedPath) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h2
              className="text-2xl font-medium text-black mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Path not found
            </h2>
            <p className="text-neutral-500 mb-6">
              This path doesn't exist or may have been removed.
            </p>
            <Link
              href={`/results/${profileId}`}
              className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary-dark h-10 px-6 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              ← Back to your paths
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Back Link */}
          <Link
            href={`/results/${profileId}`}
              className="inline-flex items-center text-sm text-neutral-700 hover:text-neutral-900 mb-6 transition-colors border-b border-transparent hover:border-secondary group"
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
              Back to your paths
            </span>
          </Link>

          {/* Page Header */}
          <div className="mb-10">
            <div
              className="inline-block text-xs tracking-[0.2em] uppercase text-neutral-500 px-3 py-1.5 bg-neutral-100 rounded-full mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Path Detail
            </div>
            <h1
              className="text-3xl lg:text-4xl text-black font-medium leading-tight mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Your path: {selectedPath.aiLabel}
            </h1>
            <p className="text-neutral-500 text-base leading-relaxed max-w-2xl">
              Real stories from people who've navigated similar career transitions.
            </p>
          </div>

          {/* Profile Summary */}
          <ProfileSummary profile={profile} />

          {/* Path Overview Card */}
          <div className="mt-10 bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  rankNumber === 1
                    ? "bg-primary-soft text-primary border border-primary-border"
                    : rankNumber === 2
                    ? "bg-secondary-soft text-secondary-dark border border-secondary-border"
                    : "bg-neutral-100 text-neutral-700"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {rankNumber}
              </div>
              <div className="flex-1">
                <h2
                  className="text-xl font-medium text-black mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {selectedPath.aiLabel}
                </h2>

                {/* Target role/industry tags */}
                {(selectedPath.targetRole || selectedPath.targetIndustry) && (
                  <div
                    className="flex flex-wrap gap-2 text-xs text-neutral-500 mb-4"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {selectedPath.targetRole && (
                    <span className="bg-primary-soft text-primary px-2 py-1 rounded border border-primary-border">
                      {selectedPath.targetRole}
                    </span>
                  )}
                  {selectedPath.targetIndustry && (
                    <span className="bg-secondary-soft text-secondary-dark px-2 py-1 rounded border border-secondary-border">
                      {selectedPath.targetIndustry}
                    </span>
                    )}
                  </div>
                )}

                <p className="text-sm text-neutral-600 leading-relaxed">
                  {selectedPath.aiExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Real Stories Section */}
          <div className="mt-12">
            <div className="mb-6">
              <h2
                className="text-xl font-medium text-black mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Real stories for this path
              </h2>
              <p className="text-sm text-neutral-500">
                {stories && stories.some((s) => s.id.startsWith("placeholder-"))
                  ? "Examples will appear here once we can fetch and process real stories that match your profile."
                  : "These are live examples pulled from around the web based on your profile and this path."}
              </p>
            </div>

            {/* Stories loading state */}
            {storiesLoading && (
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-6 h-6 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-neutral-500">Finding relevant stories...</p>
                </div>
              </div>
            )}

            {/* Stories error state */}
            {storiesError && (
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
                <p className="text-sm text-neutral-500">
                  We couldn't load stories right now. Try again later.
                </p>
              </div>
            )}

            {/* AI Overview (Gemini) */}
            {overviewLoading && (
              <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-sm text-neutral-400">Loading overview...</p>
              </div>
            )}

            {overviewData?.overview && (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 text-sm leading-relaxed shadow-sm space-y-2">
                {overviewData.overview.split("\n\n").map((block, i) => {
                  const trimmed = block.trim();
                  const isSummary = trimmed.startsWith("Summary:");
                  const isNextMoves = trimmed.startsWith("Next moves:");

                  if (!isSummary && !isNextMoves) {
                    return <p key={i} className="text-neutral-700">{trimmed}</p>;
                  }

                  const [label, ...rest] = trimmed.split(":");
                  const restText = rest.join(":").trim();

                  return (
                    <div key={i} className={`rounded-lg p-3 ${isSummary ? 'bg-primary-soft border-l-2 border-primary' : 'bg-secondary-soft border-l-2 border-secondary'}`}>
                      <p>
                        <span className={`font-semibold ${isSummary ? 'text-primary' : 'text-secondary-dark'}`}>
                          {label}:
                        </span>{" "}
                        <span className="text-neutral-700">{restText}</span>
                      </p>
                    </div>
                  );
                })}

                {overviewData.source && (
                  <div className="pt-2 text-xs text-neutral-500 flex items-center gap-2">
                    <span className="inline-flex rounded-full border border-neutral-700 px-2 py-0.5">
                      {overviewData.source === "ai" && "Powered by AI"}
                      {overviewData.source === "fallback" && "Based on web results only"}
                      {overviewData.source === "static" && "Basic overview"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Stories success state */}
            {stories && stories.length > 0 && (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3
                        className="text-lg font-medium text-black"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {story.title}
                      </h3>
                      <SourceTypeBadge type={story.sourceType} />
                    </div>

                    <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                      {story.shortSummary}
                    </p>

                    <p className="text-xs text-neutral-400 italic mb-4">
                      {story.whyItMatches}
                    </p>

                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-neutral-700 hover:text-neutral-900 transition-colors border-b border-transparent hover:border-secondary"
                    >
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className="tracking-wide"
                      >
                        Open source
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* No stories state (empty array from API when keys present but pipeline fails) */}
            {stories && stories.length === 0 && !storiesLoading && (
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
                <p className="text-sm text-neutral-500">
                  We couldn't find real stories for this path right now. Try adjusting your
                  inputs or checking back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Source Type Badge Component
function SourceTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    video: "Video",
    article: "Article",
    linkedin: "LinkedIn",
    other: "Other",
  };

  return (
    <span
      className="flex-shrink-0 text-xs px-2 py-1 bg-neutral-100 text-neutral-500 rounded"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {labels[type] ?? "Other"}
    </span>
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

