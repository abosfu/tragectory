import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200">
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
      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-[720px] px-6 py-16 md:py-24">
            <div className="space-y-8">
              <div>
                <p
                  className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  ABOUT
                </p>
                <h1
                  className={`text-4xl md:text-5xl font-semibold tracking-tight text-black ${poppins.className}`}
                >
                  What is Trajectory?
                </h1>
              </div>

              <div className="space-y-6 text-base text-neutral-700 leading-relaxed">
                <p>
                  Trajectory is a lightweight career explorer built for students and early-career people who feel stuck between options. Instead of vague personality quizzes, it gives you three concrete paths based on your actual situation.
                </p>
                <p>
                  You tell us what you're studying, what roles you're curious about, your timeline, and anything unique about your constraints. We pull in real examples from the web and use AI to summarize what each path could look like — conventional, project & portfolio heavy, and unconventional / cross-discipline.
                </p>
                <p>
                  The goal is simple: help you leave with more clarity than you came in with, and a next step you can act on this week.
                </p>
              </div>
            </div>
          </div>
        </section>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

