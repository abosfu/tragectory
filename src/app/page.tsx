"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";
import { api } from "~/trpc/react";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

type Stage = "Student" | "NewGrad" | "CareerSwitch" | "MidCareer";

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    name: string;
    studying: string;
    roles: string;
    location: string;
    timeline: string;
    extraInfo: string;
    stage: Stage | "";
  }>({
    name: "",
    studying: "",
    roles: "",
    location: "",
    timeline: "",
    extraInfo: "",
    stage: "",
  });
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const createProfile = api.profile.createProfile.useMutation();
  const generatePaths = api.recommendation.generatePathsForProfile.useMutation();

  const isLoading = createProfile.isPending || generatePaths.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.studying.trim()) {
      setError("Please tell us what you're studying or working on.");
      return;
    }
    if (!formData.roles.trim()) {
      setError("Please tell us what types of roles interest you.");
      return;
    }
    if (!formData.timeline.trim()) {
      setError("Please provide your timeline.");
      return;
    }
    if (!formData.stage) {
      setError("Please select where you are in your journey.");
      return;
    }

    try {
      // 1. Create the user profile
      const profile = await createProfile.mutateAsync({
        name: formData.name || undefined,
        currentStatus: formData.studying,
        interests: formData.roles,
        location: formData.location || undefined,
        timeline: formData.timeline,
        stage: formData.stage,
        extraInfo: formData.extraInfo || undefined,
      });

      // 2. Generate paths for this profile
      await generatePaths.mutateAsync({ profileId: profile.id });

      // 3. Navigate to results page
      router.push(`/results/${profile.id}`);
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#F3EBDD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a
              href="/"
              className="text-sm tracking-[0.25em] uppercase text-black font-medium"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TRAJECTORY
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="/about"
                className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors border-b border-transparent hover:border-secondary"
              >
                About
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Background Watermark */}
        <div className="pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 -translate-x-1/2 top-40 text-[7rem] md:text-[8rem] font-semibold tracking-tight" style={{ color: 'rgba(12, 10, 9, 0.02)' }}>
            GAIN CLARITY
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-[800px] text-[7rem] md:text-[8rem] font-semibold tracking-tight" style={{ color: 'rgba(12, 10, 9, 0.02)' }}>
            BUILD MOMENTUM
          </div>
        </div>

        {/* Section 1: Hero + Story */}
        <section className="relative">
          <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
            <div className="text-center">
              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#111827] ${poppins.className}`}
              >
                Design the next chapter of your career.
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-[#6B7280] mx-auto">
                See three tailored paths based on where you are right now, with real examples instead of generic advice.
              </p>
              <p className="mt-6 max-w-2xl text-base sm:text-lg text-[#6B7280] mx-auto leading-relaxed">
                Trajectory helps you stop guessing about your next move. Answer a few questions and compare three paths — a conventional route, a project-heavy route, and an unconventional route — so you leave with real clarity, not more confusion.
              </p>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-400">
                Scroll to answer a few quick questions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Form + Features */}
        <section className="w-full py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-start lg:gap-12">
            {/* Left Column: Form */}
            <div className="w-full max-w-xl">
              <div className="rounded-2xl bg-[#FFFFFF] border border-[#F3EBDD] shadow-[0_12px_40px_rgba(15,23,42,0.05)] px-6 py-8 sm:px-8 sm:py-9">
                <div className="mb-6 text-center">
                  <h2 className="text-lg font-medium text-[#111827]">Get started</h2>
                  <p className="mt-1 text-xs text-[#6B7280] text-center">
                    A few quick questions, then we'll show you 3 paths that fit.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      Name (optional)
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="studying"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      What are you studying or working on?
                    </label>
                    <input
                      id="studying"
                      type="text"
                      value={formData.studying}
                      onChange={(e) =>
                        setFormData({ ...formData, studying: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., CS, Marketing"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="stage"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      Where are you in your journey?
                    </label>
                    <select
                      id="stage"
                      value={formData.stage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stage: e.target.value as Stage | "",
                        })
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E4DED2] rounded-lg focus:border-[#0F9F6A] focus:outline-none focus:ring-2 focus:ring-[#0F9F6A]/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: "right 0.75rem center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "1.25rem 1.25rem",
                      }}
                    >
                      <option value="">Select your stage</option>
                      <option value="Student">Student</option>
                      <option value="NewGrad">New grad</option>
                      <option value="CareerSwitch">Career switch</option>
                      <option value="MidCareer">Mid-career</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="roles"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      What roles are you curious about?
                    </label>
                    <textarea
                      id="roles"
                      value={formData.roles}
                      onChange={(e) =>
                        setFormData({ ...formData, roles: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full min-h-[80px] px-4 py-3 bg-[#FFFFFF] border border-[#E4DED2] rounded-lg focus:border-[#0F9F6A] focus:outline-none focus:ring-2 focus:ring-[#0F9F6A]/20 transition-colors resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., product, SWE, sales"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="timeline"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      Timeline
                    </label>
                    <input
                      id="timeline"
                      type="text"
                      value={formData.timeline}
                      onChange={(e) =>
                        setFormData({ ...formData, timeline: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-[#FFFFFF] border border-[#E4DED2] rounded-lg focus:border-[#0F9F6A] focus:outline-none focus:ring-2 focus:ring-[#0F9F6A]/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., next 6–12 months"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="location"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., Toronto"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="extraInfo"
                      className="block text-sm text-neutral-700 font-medium"
                    >
                      Anything unique about your situation? (optional)
                    </label>
                    <textarea
                      id="extraInfo"
                      value={formData.extraInfo}
                      onChange={(e) =>
                        setFormData({ ...formData, extraInfo: e.target.value })
                      }
                      disabled={isLoading}
                      className="w-full min-h-[70px] px-4 py-3 bg-[#FFFFFF] border border-[#E4DED2] rounded-lg focus:border-[#0F9F6A] focus:outline-none focus:ring-2 focus:ring-[#0F9F6A]/20 transition-colors resize-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="e.g., visa, family, GPA, money"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#0F9F6A] px-4 py-3 text-sm font-medium text-white hover:bg-[#0B7E54] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Creating your paths..." : "Show me my paths →"}
                  </button>
                  <p className="mt-2 text-xs text-neutral-400 text-center">
                    Under 60 seconds. 3 paths with pros, cons, and examples.
                  </p>
                </form>
                </div>
              </div>

              {/* Right Column: Features */}
              <div className="w-full md:flex-1 space-y-4">
                <div className="rounded-2xl bg-[#FFFFFF] border border-[#F3EBDD] shadow-[0_12px_40px_rgba(15,23,42,0.05)] flex flex-col gap-2 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F6ED] text-[#0F9F6A]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-[#111827]">
                    Compare 3 paths side-by-side
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    See how each path changes your skills, timeline, and options.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#FFFFFF] border border-[#F3EBDD] shadow-[0_12px_40px_rgba(15,23,42,0.05)] flex flex-col gap-2 px-4 py-3 sm:px-5 sm:py-4">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF6D8] text-[#E0A400]">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-[#111827]">
                    Real examples, not generic advice
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    Pulled from real case studies, job posts, and people like you.
                  </p>
                </div>
              </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#F3EBDD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div
              className="text-xs tracking-[0.2em] uppercase text-neutral-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TRAJECTORY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
