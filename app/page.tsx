import Link from "next/link";
import Footer from "@/app/components/Footer";
import LandingNav from "@/app/components/LandingNav";

export default function LandingPage() {
  return (
    <main className="bg-navy">
      {/* ── HERO SECTION ── */}
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        {/* ── Full-screen Background Image ── */}
        <div
          className="absolute inset-0 bg-cover bg-[position:center_20%] bg-no-repeat bg-[url('/landing-mobile.png')] md:bg-[url('/landing-desktop.png')]"
          aria-hidden="true"
        />

        {/* ── Radial gradient overlay ── */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(10,25,47,0.7) 70%, rgba(10,25,47,0.95) 100%)",
          }}
          aria-hidden="true"
        />

        {/* ── Responsive Top Navigation ── */}
        <LandingNav />

        {/* ── HERO CONTENT WRAPPER ── */}
        <div className="relative z-10 flex flex-1 flex-col justify-center pt-12 md:pt-0">

          {/* Title & Tagline (Desktop) */}
          <div className="hidden text-center md:block md:-mt-20">
            <h1 className="text-6xl font-extrabold tracking-tight text-white md:text-8xl">
              GafferScore
            </h1>
            <p className="mt-4 text-sm font-light tracking-[0.1em] uppercase text-white/70">
              Predict the Score. Own the Leaderboard.
            </p>
            <p className="mt-3 text-xs text-white/60">
              Join other football fans
            </p>
          </div>

          {/* Bottom Panel */}
          <div className="px-6 md:p-0 md:mt-16">

            {/* Title & Tagline (Mobile) */}
            <div className="mb-8 text-center md:hidden">
              <h1 className="text-6xl font-extrabold tracking-tight text-white">
                GafferScore
              </h1>
              <p className="mt-3 text-[10px] font-light tracking-[0.1em] uppercase text-white/70">
                Predict the Score. Own the Leaderboard.
              </p>
              <p className="mt-2 text-xs text-white/50">
                Join other football fans
              </p>
            </div>

            <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4">
              <Link
                href="/auth?mode=signup"
                className="btn-interactive btn-glow flex min-h-[44px] w-full items-center justify-center rounded-md bg-mint px-6 py-4 text-sm font-bold uppercase tracking-wider text-navy"
              >
                Sign Up
              </Link>
              <Link
                href="/auth?mode=login"
                className="btn-interactive flex min-h-[44px] w-full items-center justify-center rounded-md border-2 border-mint bg-transparent px-6 py-4 text-sm font-bold uppercase tracking-wider text-mint transition-colors hover:bg-mint/10 md:bg-black/20"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS SECTION ── */}
      <section className="relative z-10 border-t border-white/10 bg-navy px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center text-white">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-sm font-light text-white/60">
              Three simple steps to prove your football knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-mint">
                1
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Pick Your Matches</h3>
              <p className="text-sm leading-relaxed text-white/60">
                Select from the upcoming Premier League fixtures. Predictions lock exactly when the whistle blows.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-mint">
                2
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Predict the Score</h3>
              <p className="text-sm leading-relaxed text-white/60">
                Call the exact final score. Earn 50 points for a perfect score, or 20 points for the correct match outcome.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-mint">
                3
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Climb the Leaderboard</h3>
              <p className="text-sm leading-relaxed text-white/60">
                Compete against other football fans. Track your global ranking and weekly gameweek performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="relative z-10 block bg-navy">
        <Footer />
      </div>
    </main>
  );
}
