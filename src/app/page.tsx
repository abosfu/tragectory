"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    studying: "",
    roles: "",
    location: "",
    timeline: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/paths");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="text-sm tracking-[0.25em] uppercase text-black font-medium"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TRAJECTORY
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#about"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                About
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-neutral-500 hover:text-black transition-colors"
              >
                How it works
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 py-16 lg:py-24">
            {/* Left Column - Hero Content */}
            <div className="flex flex-col justify-center">
              <div className="space-y-6">
                <div
                  className="inline-block text-xs tracking-[0.2em] uppercase text-neutral-500 px-3 py-1.5 bg-neutral-100 rounded-full"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Career Explorer
                </div>
                <h1
                  className="text-4xl lg:text-5xl xl:text-6xl text-black font-medium leading-[1.1] tracking-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Explore different paths your career could take.
                </h1>
                <p className="text-lg text-neutral-500 leading-relaxed max-w-lg">
                  Discover structured career and co-op paths with real case
                  studies from people who've navigated similar journeys. See
                  what's possible from where you are now.
                </p>
              </div>

              {/* Features */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-black"
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
                  <h3 className="font-medium text-black">Multiple Paths</h3>
                  <p className="text-sm text-neutral-500">
                    Compare different career directions side by side
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-black"
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
                  <h3 className="font-medium text-black">Real Stories</h3>
                  <p className="text-sm text-neutral-500">
                    Learn from actual case studies and experiences
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex items-center">
              <div className="w-full bg-neutral-50 rounded-2xl p-8 lg:p-10 border border-neutral-200">
                <div className="mb-8">
                  <h2
                    className="text-2xl font-medium text-black mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Get started
                  </h2>
                  <p className="text-neutral-500 text-sm">
                    Tell us a bit about yourself to see relevant paths.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="block text-sm text-neutral-600 font-medium"
                    >
                      Name{" "}
                      <span className="text-neutral-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="studying"
                      className="block text-sm text-neutral-600 font-medium"
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
                      className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                      placeholder="e.g., Computer Science, Marketing"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="roles"
                      className="block text-sm text-neutral-600 font-medium"
                    >
                      What types of roles interest you?
                    </label>
                    <textarea
                      id="roles"
                      value={formData.roles}
                      onChange={(e) =>
                        setFormData({ ...formData, roles: e.target.value })
                      }
                      className="w-full min-h-[80px] px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors resize-none text-sm"
                      placeholder="e.g., Software development, product management..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="location"
                        className="block text-sm text-neutral-600 font-medium"
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
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                        placeholder="e.g., Toronto"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="timeline"
                        className="block text-sm text-neutral-600 font-medium"
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
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                        placeholder="Next 6-12 months"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-neutral-800 h-12 text-sm font-medium rounded-lg transition-colors mt-2"
                  >
                    See possible paths →
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
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
