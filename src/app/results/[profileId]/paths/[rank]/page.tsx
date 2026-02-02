"use client";

import Link from "next/link";
import { use } from "react";
import { Poppins } from "next/font/google";
import { api } from "~/trpc/react";
import type { StoryForProfile } from "~/server/api/routers/stories";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

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
      <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-[#2F8F5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[rgba(11,11,12,0.65)]">Loading path...</p>
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
      <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h2
              className={`text-2xl font-medium text-[#0B0B0C] mb-4 ${poppins.className}`}
            >
              Path not found
            </h2>
            <p className="text-[rgba(11,11,12,0.65)] mb-6">
              This path doesn't exist or may have been removed.
            </p>
            <Link
              href={`/results/${profileId}`}
              className="inline-flex items-center justify-center bg-[#2F8F5B] text-white hover:bg-[#0B7E54] h-10 px-6 text-sm font-medium rounded-lg transition-colors duration-200"
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
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          {/* Back Link */}
          <Link
            href={`/results/${profileId}`}
            className="inline-flex items-center text-xs text-[rgba(11,11,12,0.65)] hover:text-[#0B0B0C] mb-6 transition-colors duration-200 border-b border-transparent hover:border-[#2F8F5B] group"
          >
            <svg
              className="w-3 h-3 mr-1.5 group-hover:-translate-x-0.5 transition-transform duration-200"
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
              className="text-[10px] tracking-wide"
            >
              Back to your paths
            </span>
          </Link>

          {/* Page Header */}
          <div className="mb-12">
            <h1
              className={`text-3xl lg:text-4xl text-[#0B0B0C] font-semibold leading-tight mb-3 ${poppins.className}`}
            >
              Real stories for this path
            </h1>
            <p className="text-sm text-[rgba(11,11,12,0.65)] leading-relaxed max-w-2xl">
              {stories && stories.some((s) => s.id.startsWith("placeholder-"))
                ? "Examples will appear here once we can fetch and process real stories that match your profile."
                : "These are live examples pulled from around the web based on your profile and this path."}
            </p>
          </div>

          {/* Profile Summary */}
          <ProfileSummary profile={profile} />

          {/* Path Overview Card */}
          <div className="mt-10 bg-[rgba(255,255,255,0.72)] border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-[rgba(47,143,91,0.12)] text-[#2F8F5B]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {rankNumber}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-xl font-medium text-[#0B0B0C] mb-2 ${poppins.className}`}
                >
                  {selectedPath.aiLabel}
                </h2>

                {/* Target role/industry tags */}
                {(selectedPath.targetRole || selectedPath.targetIndustry) && (
                  <div
                    className="flex flex-wrap gap-2 text-xs mb-4"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {selectedPath.targetRole && (
                      <span className="bg-[rgba(47,143,91,0.12)] text-[#2F8F5B] px-2.5 py-1 rounded-full">
                        {selectedPath.targetRole}
                      </span>
                    )}
                    {selectedPath.targetIndustry && (
                      <span className="bg-[rgba(215,178,74,0.14)] text-[#D7B24A] px-2.5 py-1 rounded-full">
                        {selectedPath.targetIndustry}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm text-[rgba(11,11,12,0.65)] leading-relaxed">
                  {selectedPath.aiExplanation}
                </p>
              </div>
            </div>
          </div>

          {/* Real Stories Section */}
          <div className="mt-12">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2
                  className={`text-xl font-medium text-[#0B0B0C] mb-2 ${poppins.className}`}
                >
                  Real stories for this path
                </h2>
                {overviewData?.source && overviewData.source === "fallback" && (
                  <span className="inline-flex text-[10px] text-[rgba(11,11,12,0.5)] px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.10)] bg-transparent">
                    Based on web results only
                  </span>
                )}
              </div>
            </div>

            {/* Stories loading state */}
            {storiesLoading && (
              <div className="bg-[rgba(255,255,255,0.72)] rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-6 h-6 border-2 border-[#2F8F5B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[rgba(11,11,12,0.65)]">Finding relevant stories...</p>
                </div>
              </div>
            )}

            {/* Stories error state */}
            {storiesError && (
              <div className="bg-[rgba(255,255,255,0.72)] rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 text-center">
                <p className="text-sm text-[rgba(11,11,12,0.65)]">
                  We couldn't load stories right now. Try again later.
                </p>
              </div>
            )}

            {/* AI Overview (Gemini) */}
            {overviewLoading && (
              <div className="mb-6 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
                <p className="text-sm text-[rgba(11,11,12,0.5)]">Loading overview...</p>
              </div>
            )}

            {overviewData?.overview && (
              <div className="mb-8 space-y-4">
                {overviewData.overview.split("\n\n").map((block, i) => {
                  const trimmed = block.trim();
                  const isSummary = trimmed.startsWith("Summary:");
                  const isNextMoves = trimmed.startsWith("Next moves:");

                  if (!isSummary && !isNextMoves) {
                    return <p key={i} className="text-sm text-[rgba(11,11,12,0.65)] leading-relaxed">{trimmed}</p>;
                  }

                  const [label, ...rest] = trimmed.split(":");
                  const restText = rest.join(":").trim();

                  return (
                    <div
                      key={i}
                      className={`rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 ${
                        isSummary ? "bg-[rgba(47,143,91,0.10)]" : "bg-[rgba(215,178,74,0.12)]"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        <span className={`font-semibold ${isSummary ? 'text-[#2F8F5B]' : 'text-[#D7B24A]'} ${poppins.className}`}>
                          {label}:
                        </span>{" "}
                        <span className="text-[rgba(11,11,12,0.65)]">{restText}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stories success state */}
            {stories && stories.length > 0 && (
              <div className="space-y-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="bg-[rgba(255,255,255,0.72)] border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3
                        className={`text-lg font-semibold text-[#0B0B0C] flex-1 ${poppins.className}`}
                      >
                        {story.title}
                      </h3>
                      <SourceTypeBadge type={story.sourceType} />
                    </div>

                    <p className="text-sm text-[rgba(11,11,12,0.65)] leading-relaxed mb-4">
                      {story.shortSummary}
                    </p>

                    <div className="mb-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
                      <p className="text-xs font-medium text-[rgba(11,11,12,0.5)] mb-1.5 uppercase tracking-wide">
                        Why this matters
                      </p>
                      <p className="text-xs text-[rgba(11,11,12,0.65)] leading-relaxed">
                        {story.whyItMatches}
                      </p>
                    </div>

                    <a
                      href={story.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#2F8F5B] hover:text-[#0B7E54] transition-all duration-200 border-b border-transparent hover:border-[#2F8F5B] group"
                    >
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className="tracking-wide"
                      >
                        Open source
                      </span>
                      <svg
                        className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
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
              <div className="bg-[rgba(255,255,255,0.72)] rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-6 text-center">
                <p className="text-sm text-[rgba(11,11,12,0.65)]">
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
      className="flex-shrink-0 text-[10px] px-2 py-1 text-[rgba(11,11,12,0.5)] rounded-full border border-[rgba(0,0,0,0.10)] bg-transparent"
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
    <div className="bg-[rgba(255,255,255,0.72)] rounded-2xl p-6 border border-[rgba(0,0,0,0.08)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <h3
        className="text-xs font-medium text-[rgba(11,11,12,0.5)] mb-5 uppercase tracking-[0.1em]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Your Profile
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-xs text-[rgba(11,11,12,0.5)] mb-1.5">Current Status</p>
          <p className="text-sm text-[#0B0B0C] font-medium">{profile.currentStatus}</p>
        </div>
        <div>
          <p className="text-xs text-[rgba(11,11,12,0.5)] mb-1.5">Timeline</p>
          <p className="text-sm text-[#0B0B0C] font-medium">{profile.timeline}</p>
        </div>
        <div>
          <p className="text-xs text-[rgba(11,11,12,0.5)] mb-1.5">Stage</p>
          <p className="text-sm text-[#0B0B0C] font-medium">{formatStageLabel(profile.stage)}</p>
        </div>
        <div>
          <p className="text-xs text-[rgba(11,11,12,0.5)] mb-1.5">Interests</p>
          <p className="text-sm text-[#0B0B0C] font-medium line-clamp-2">
            {profile.interests}
          </p>
        </div>
      </div>
      {profile.extraInfo && profile.extraInfo.trim() && (
        <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.08)]">
          <p className="text-xs text-[rgba(11,11,12,0.5)] mb-1.5">Extra Context</p>
          <p className="text-xs text-[rgba(11,11,12,0.65)] leading-relaxed">{profile.extraInfo}</p>
        </div>
      )}
    </div>
  );
}

// Header Component
function Header() {
  return (
    <header className="border-b border-[rgba(0,0,0,0.08)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-sm tracking-[0.25em] uppercase text-[#0B0B0C] font-medium hover:opacity-70 transition-opacity duration-200"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            TRAJECTORY
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-[rgba(11,11,12,0.65)] hover:text-[#0B0B0C] transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm text-[rgba(11,11,12,0.65)] hover:text-[#0B0B0C] transition-colors duration-200 border-b border-transparent hover:border-[#D7B24A]"
            >
              About
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
    <footer className="border-t border-[rgba(0,0,0,0.08)] mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div
            className="text-xs tracking-[0.2em] uppercase text-[rgba(11,11,12,0.5)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            TRAJECTORY
          </div>
        </div>
      </div>
    </footer>
  );
}

