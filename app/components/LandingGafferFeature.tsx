"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const fadeLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

const fadeRight = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

const CHIPS = [
    {
        title: "Scoreline Matrix",
        desc: "Probability breakdown for every possible final scoreline",
    },
    {
        title: "xG Analysis",
        desc: "Expected goals data on every Premier League fixture",
    },
    {
        title: "AI Chat",
        desc: "Ask The Gaffer anything about the upcoming matches",
    },
];

const PROB_ROWS = [
    { label: "Arsenal", pct: 64, accent: true },
    { label: "Draw", pct: 22, accent: false },
    { label: "Chelsea", pct: 14, accent: false },
];

const TOP_PICKS = [
    { score: "2–0", pct: "26%", hot: true },
    { score: "1–0", pct: "21%", hot: false },
    { score: "2–1", pct: "17%", hot: false },
];

export default function LandingGafferFeature() {
    return (
        <section className="relative z-10 overflow-hidden border-t border-white/10 bg-navy-light px-6 py-24 md:px-12">
            {/* Subtle mint radial glow positioned behind the mock card */}
            <div
                className="pointer-events-none absolute right-0 top-1/2 h-[700px] w-[700px] -translate-y-1/2 translate-x-1/2 rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(57,255,20,0.05) 0%, transparent 65%)",
                }}
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-6xl">
                <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">

                    {/* ── Left: copy & chips ── */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.25 }}
                        variants={fadeLeft}
                    >
                        <span className="mb-5 inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-mint">
                            The Gaffer AI
                        </span>

                        <h2 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                            Not a Pundit.
                            <br />
                            Not a Guess.
                        </h2>

                        <p className="mb-10 max-w-md text-[15px] leading-relaxed text-white/50">
                            The Gaffer analyses every Premier League fixture using probability
                            matrices, expected goals, and historical form data. Cold data.
                            No bias. Just football.
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {CHIPS.map((chip, i) => (
                                <motion.div
                                    key={chip.title}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 + i * 0.1 }}
                                    className="rounded-xl border border-white/8 bg-white/3 p-4"
                                >
                                    <div className="mb-1.5 text-[11px] font-bold text-mint">
                                        {chip.title}
                                    </div>
                                    <div className="text-[11px] leading-relaxed text-white/35">
                                        {chip.desc}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Right: mock Gaffer UI card ── */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.25 }}
                        variants={fadeRight}
                    >
                        <div
                            className="glass-card rounded-2xl p-5 md:p-6"
                            style={{
                                border: "1px solid rgba(57,255,20,0.18)",
                                boxShadow: "0 0 50px rgba(57,255,20,0.05), 0 20px 60px rgba(0,0,0,0.4)",
                            }}
                        >
                            {/* Card header */}
                            <div className="mb-5 flex items-center gap-3">
                                <img
                                    src="/gaffer-avatar.png"
                                    alt="The Gaffer"
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                                <div>
                                    <div className="text-sm font-bold text-white">The Gaffer</div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-mint" />
                                        <span className="text-[10px] font-medium text-mint">
                                            AI Prediction Engine
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fixture block */}
                            <div
                                className="mb-4 rounded-xl p-4"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                            >
                                <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/30">
                                    Arsenal vs Chelsea · GW33
                                </div>

                                {/* Probability bars */}
                                <div className="space-y-2.5">
                                    {PROB_ROWS.map((row) => (
                                        <div key={row.label}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className={`text-xs font-semibold ${row.accent ? "text-white" : "text-white/40"}`}>
                                                    {row.label}
                                                </span>
                                                <span className={`text-xs font-black ${row.accent ? "text-mint" : "text-white/30"}`}>
                                                    {row.pct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${row.accent ? "bg-mint" : "bg-white/20"}`}
                                                    style={{ width: `${row.pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Top picks */}
                                <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                    <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/25">
                                        Top Picks
                                    </div>
                                    <div className="flex gap-2">
                                        {TOP_PICKS.map((pick) => (
                                            <div
                                                key={pick.score}
                                                className="flex-1 rounded-lg py-2 px-1 text-center"
                                                style={{
                                                    background: pick.hot ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.03)",
                                                    border: pick.hot ? "1px solid rgba(57,255,20,0.25)" : "1px solid rgba(255,255,255,0.06)",
                                                }}
                                            >
                                                <div className={`text-sm font-black ${pick.hot ? "text-mint" : "text-white/45"}`}>
                                                    {pick.score}
                                                </div>
                                                <div className={`text-[9px] font-medium ${pick.hot ? "text-mint/55" : "text-white/22"}`}>
                                                    {pick.pct}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mock chat */}
                            <div className="mb-4 space-y-2.5">
                                {/* User message */}
                                <div className="flex justify-end">
                                    <div
                                        className="max-w-[80%] rounded-xl rounded-tr-sm px-3 py-2"
                                        style={{
                                            background: "rgba(57,255,20,0.07)",
                                            border: "1px solid rgba(57,255,20,0.14)",
                                        }}
                                    >
                                        <p className="font-mono text-[11px] text-white/65">
                                            Which match are you most confident about?
                                        </p>
                                    </div>
                                </div>

                                {/* Gaffer response */}
                                <div className="flex items-start gap-2">
                                    <img
                                        src="/gaffer-avatar.png"
                                        alt=""
                                        aria-hidden="true"
                                        className="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover"
                                    />
                                    <div
                                        className="max-w-[85%] rounded-xl rounded-tl-sm px-3 py-2"
                                        style={{
                                            background: "rgba(255,255,255,0.04)",
                                            border: "1px solid rgba(255,255,255,0.07)",
                                        }}
                                    >
                                        <p className="font-mono text-[11px] leading-relaxed text-white/55">
                                            The data indicates Arsenal at home. 64% probability.
                                            Their defensive record this run makes the opposition
                                            irrelevant.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <Link
                                href="/auth?mode=signup"
                                className="btn-interactive block w-full rounded-xl py-3 text-center text-[11px] font-bold uppercase tracking-[0.15em] text-mint transition-colors hover:bg-mint/5"
                                style={{ border: "1px solid rgba(57,255,20,0.22)" }}
                            >
                                Unlock AI Predictions
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
