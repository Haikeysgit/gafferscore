import Link from "next/link";
import LandingNav from "@/app/components/LandingNav";
import Footer from "@/app/components/Footer";
import LandingGafferFeature from "@/app/components/LandingGafferFeature";
import LandingFixtures from "@/app/components/LandingFixtures";
import LandingLeaderboard from "@/app/components/LandingLeaderboard";
import { getGameweeks, getFixtures, getLeaderboard } from "@/lib/actions";
import { isFixtureLive, isFixtureFullTime } from "@/lib/fixture-status";
import type { FixtureData, GameweekData, LeaderboardEntry } from "@/lib/actions";

export const revalidate = 60;

function resolveGameweekLabel(fixtures: FixtureData[]): string {
    if (fixtures.some((f) => isFixtureLive(f.status))) return "Live";
    if (fixtures.every((f) => isFixtureFullTime(f.status))) return "Full Time";
    return "Upcoming";
}

const SCORING_CARDS = [
    {
        pts: "50",
        label: "Perfect Call",
        desc: "Predict the exact final scoreline",
        accent: true,
    },
    {
        pts: "20",
        label: "Right Result",
        desc: "Get the correct win, draw or loss",
        accent: false,
    },
    {
        pts: "0",
        label: "Back to the Drawing Board",
        desc: "No points. No excuses.",
        accent: null,
    },
];

const HOW_STEPS = [
    {
        n: "1",
        title: "Pick Your Matches",
        desc: "Select from the upcoming Premier League fixtures. Predictions lock at kickoff.",
    },
    {
        n: "2",
        title: "Predict the Score",
        desc: "Call the exact final score. Use The Gaffer to sharpen your picks.",
    },
    {
        n: "3",
        title: "Climb the Leaderboard",
        desc: "Compete globally. Track your rank and gameweek performance.",
    },
];

export default async function LandingPage() {
    let gameweeks: GameweekData[] = [];
    let topEntries: LeaderboardEntry[] = [];

    const [gameweeksResult, leaderboardResult] = await Promise.allSettled([
        getGameweeks(),
        getLeaderboard("global", null, 1, 5),
    ]);

    if (gameweeksResult.status === "fulfilled") gameweeks = gameweeksResult.value;
    if (leaderboardResult.status === "fulfilled") topEntries = leaderboardResult.value.entries;

    const currentGw: GameweekData | null =
        gameweeks.find((g) => g.is_current) ?? gameweeks[gameweeks.length - 1] ?? null;

    let fixtures: FixtureData[] = [];
    if (currentGw) {
        const result = await Promise.allSettled([getFixtures(currentGw.id)]);
        if (result[0].status === "fulfilled") fixtures = result[0].value;
    }

    const gameweekLabel = fixtures.length > 0 ? resolveGameweekLabel(fixtures) : "Upcoming";

    return (
        <>
            <LandingNav />
            <main className="flex-grow">

                {/* ── 1. HERO ── */}
                <div className="relative flex min-h-screen flex-col overflow-hidden">
                    {/* Background image */}
                    <div
                        className="absolute inset-0 bg-cover bg-[position:center_20%] bg-no-repeat bg-[url('/landing-mobile.png')] md:bg-[url('/landing-desktop.png')]"
                        aria-hidden="true"
                    />

                    {/* Gradient overlay — strong bottom fade so hero bleeds into next section */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to bottom, rgba(10,25,47,0.25) 0%, rgba(10,25,47,0.45) 35%, rgba(10,25,47,0.82) 70%, #0A192F 100%)",
                        }}
                        aria-hidden="true"
                    />

                    {/* Hero content */}
                    <div className="relative z-10 flex flex-1 flex-col pb-24 pt-16 md:justify-center md:pb-0 md:pt-0">

                        {/* Title block */}
                        <div className="text-center md:-mt-16">
                            {/* AI badge */}
                            <div className="mb-6 flex justify-center">
                                <span
                                    className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-mint"
                                    style={{
                                        background: "rgba(57,255,20,0.07)",
                                        border: "1px solid rgba(57,255,20,0.22)",
                                    }}
                                >
                                    <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                                    Powered by The Gaffer AI
                                </span>
                            </div>

                            <h1 className="text-7xl font-extrabold tracking-tight text-white md:text-9xl">
                                GafferScore
                            </h1>
                            <p className="mt-5 text-sm font-light tracking-[0.12em] uppercase text-white/60 md:text-base">
                                Predict the Score. Own the Leaderboard.
                            </p>
                            <p className="mt-3 text-xs text-white/40">
                                Join other football fans in the Premier League prediction game
                            </p>
                        </div>

                        {/* Push buttons to bottom on mobile */}
                        <div className="flex-1 md:hidden" />

                        {/* CTA buttons */}
                        <div className="px-6 md:p-0 md:mt-14">
                            <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4">
                                <Link
                                    href="/auth?mode=signup"
                                    className="btn-interactive btn-glow flex min-h-[50px] w-full items-center justify-center rounded-lg bg-mint px-6 py-4 text-sm font-bold uppercase tracking-wider text-navy transition-transform active:scale-95"
                                >
                                    Sign Up
                                </Link>
                                <Link
                                    href="/auth?mode=login"
                                    className="btn-interactive flex min-h-[50px] w-full items-center justify-center rounded-lg border-2 border-mint bg-transparent px-6 py-4 text-sm font-bold uppercase tracking-wider text-mint transition-all duration-200 hover:bg-mint/10 active:scale-95"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Scroll indicator — desktop only */}
                    <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
                        <div className="bounce-arrow text-white/30">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── 2. THE GAFFER AI FEATURE ── */}
                <LandingGafferFeature />

                {/* ── 3. LIVE FIXTURES ── */}
                {currentGw && fixtures.length > 0 && (
                    <LandingFixtures
                        fixtures={fixtures}
                        gameweekName={currentGw.name}
                        label={gameweekLabel}
                    />
                )}

                {/* ── 4. HOW YOU SCORE ── */}
                <section className="relative z-10 border-t border-white/10 bg-navy px-6 py-24 md:px-12">
                    <div className="mx-auto max-w-6xl">

                        {/* Header */}
                        <div className="mb-16 text-center">
                            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                                How You Score
                            </h2>
                            <p className="mt-4 text-sm text-white/45">
                                Points are earned on accuracy. Exact scores win the most.
                            </p>
                        </div>

                        {/* Points cards */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {SCORING_CARDS.map((card) => (
                                <div
                                    key={card.pts}
                                    className={`glass-card rounded-2xl p-8 text-center ${
                                        card.accent === null ? "opacity-50" : ""
                                    }`}
                                    style={{
                                        border:
                                            card.accent === true
                                                ? "1px solid rgba(57,255,20,0.2)"
                                                : card.accent === false
                                                ? "1px solid rgba(255,255,255,0.1)"
                                                : "1px solid rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <div
                                        className={`mb-1 text-6xl font-black ${
                                            card.accent === true
                                                ? "text-mint"
                                                : card.accent === false
                                                ? "text-white"
                                                : "text-white/35"
                                        }`}
                                    >
                                        {card.pts}
                                    </div>
                                    <div
                                        className={`mb-6 text-[10px] font-bold uppercase tracking-widest ${
                                            card.accent === true
                                                ? "text-mint/55"
                                                : "text-white/25"
                                        }`}
                                    >
                                        pts
                                    </div>
                                    <div className="mb-2 text-base font-bold text-white">
                                        {card.label}
                                    </div>
                                    <div className="text-sm text-white/40">{card.desc}</div>
                                </div>
                            ))}
                        </div>

                        {/* 3-step flow */}
                        <div className="relative mt-20">
                            {/* Connecting line (desktop) */}
                            <div
                                className="absolute left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] top-8 hidden h-px md:block"
                                style={{ background: "rgba(255,255,255,0.08)" }}
                                aria-hidden="true"
                            />

                            <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
                                {HOW_STEPS.map((step) => (
                                    <div
                                        key={step.n}
                                        className="flex flex-col items-center text-center md:px-8"
                                    >
                                        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-black text-mint">
                                            {step.n}
                                        </div>
                                        <div className="mb-2 text-base font-bold text-white">
                                            {step.title}
                                        </div>
                                        <div className="text-sm leading-relaxed text-white/45">
                                            {step.desc}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 5. LEADERBOARD PREVIEW ── */}
                {topEntries.length > 0 && (
                    <LandingLeaderboard entries={topEntries} />
                )}

                {/* ── 6. FINAL CTA ── */}
                <section
                    className="relative z-10 border-t border-white/10 px-6 py-28 text-center md:px-12"
                    style={{
                        background:
                            "linear-gradient(to bottom, #112240 0%, #0A192F 100%)",
                    }}
                >
                    <div className="mx-auto max-w-xl">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Ready to Prove You Know Football?
                        </h2>
                        <p className="mt-5 text-base leading-relaxed text-white/45">
                            Join GafferScore. Predict scores. Use The Gaffer. Win bragging
                            rights.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4">
                            <Link
                                href="/auth?mode=signup"
                                className="btn-interactive btn-glow flex min-h-[52px] items-center justify-center rounded-lg bg-mint px-10 py-4 text-sm font-bold uppercase tracking-wider text-navy transition-transform active:scale-95"
                            >
                                Sign Up — It&apos;s Free
                            </Link>
                            <Link
                                href="/auth?mode=login"
                                className="text-sm text-white/30 underline-offset-4 transition-colors hover:text-white/60 hover:underline"
                            >
                                Already have an account? Login
                            </Link>
                        </div>
                    </div>
                </section>

            </main>
            <Footer />
        </>
    );
}
