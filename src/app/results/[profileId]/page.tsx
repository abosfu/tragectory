"use client";

import Link from "next/link";
import { use } from "react";
import { Poppins } from "next/font/google";
import { api } from "~/trpc/react";

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
      <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-2 border-[#2F8F5B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[rgba(11,11,12,0.65)]">Loading your paths...</p>
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
      <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <h2
              className={`text-2xl font-medium text-[#0B0B0C] mb-4 ${poppins.className}`}
            >
              Profile not found
            </h2>
            <p className="text-[rgba(11,11,12,0.65)] mb-6">
              We couldn't find this profile. It may have been deleted or the link is incorrect.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#2F8F5B] text-white hover:bg-[#0B7E54] h-10 px-6 text-sm font-medium rounded-lg transition-colors duration-200"
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
      <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <ProfileSummary profile={profile} />
            <div className="text-center py-16 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.72)] shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <h3
                className={`text-xl font-medium text-[#0B0B0C] mb-2 ${poppins.className}`}
              >
                No paths generated yet
              </h3>
              <p className="text-[rgba(11,11,12,0.65)] mb-6">
                Something went wrong generating your paths. Please try again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-[#2F8F5B] text-white hover:bg-[#0B7E54] h-10 px-6 text-sm font-medium rounded-lg transition-colors duration-200"
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
    <div className="min-h-screen bg-[#FBF7EF] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/"
                className="inline-flex items-center text-xs text-[rgba(11,11,12,0.65)] hover:text-[#0B0B0C] transition-colors duration-200 border-b border-transparent hover:border-[#2F8F5B] group"
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
                  Start new exploration
                </span>
              </Link>
              <div
                className="inline-block text-[10px] tracking-[0.15em] uppercase text-[rgba(11,11,12,0.5)] px-2.5 py-1 rounded-full"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Your Results
              </div>
            </div>
            <h1
              className={`text-3xl lg:text-4xl text-[#0B0B0C] font-semibold leading-tight mb-3 ${poppins.className}`}
            >
              Your possible trajectories
            </h1>
            <p className="text-[rgba(11,11,12,0.65)] text-base leading-relaxed max-w-2xl">
              Based on your background and interests, here are three possible
              career directions you could explore.
            </p>
          </div>

          {/* Profile Summary */}
          <ProfileSummary profile={profile} />

          {/* Paths List */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-xl font-medium text-[#0B0B0C] ${poppins.className}`}
              >
                Recommended Paths
              </h2>
              <span className="text-xs text-[rgba(11,11,12,0.5)]">
                {paths.length} {paths.length === 1 ? "path" : "paths"}
              </span>
            </div>

            <div className="space-y-4">
              {paths.map((path, index) => (
                <div
                  key={path.id}
                  className="bg-[rgba(255,255,255,0.72)] border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-200 ease-out hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank badge */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-[rgba(47,143,91,0.12)] text-[#2F8F5B]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {index + 1}
                    </div>

                    <div className="flex-1">
                      <h3
                        className={`text-lg font-medium text-[#0B0B0C] mb-2 ${poppins.className}`}
                      >
                        {path.aiLabel}
                      </h3>

                      {/* Target role/industry tags */}
                      {(path.targetRole || path.targetIndustry) && (
                        <div
                          className="flex flex-wrap gap-2 text-xs mb-3"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {path.targetRole && (
                            <span className="bg-[rgba(47,143,91,0.12)] text-[#2F8F5B] px-2.5 py-1 rounded-full">
                              {path.targetRole}
                            </span>
                          )}
                          {path.targetIndustry && (
                            <span className="bg-[rgba(215,178,74,0.14)] text-[#D7B24A] px-2.5 py-1 rounded-full">
                              {path.targetIndustry}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-sm text-[rgba(11,11,12,0.65)] leading-relaxed mb-4">
                        {path.aiExplanation}
                      </p>

                      <Link
                        href={`/results/${profileId}/paths/${path.rank}`}
                        className="inline-flex items-center text-sm text-[#2F8F5B] hover:text-[#0B7E54] transition-all duration-200 border-b border-transparent hover:border-[#2F8F5B] group"
                      >
                        <span
                          style={{ fontFamily: "var(--font-mono)" }}
                          className="tracking-wide"
                        >
                          View real stories
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
