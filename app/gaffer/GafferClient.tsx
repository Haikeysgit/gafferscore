"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/app/components/DashboardHeader";

interface Prediction {
    fixture_id: string;
    home_team: string;
    away_team: string;
    kickoff_time: string;
    gameweek: number;
    top_pick_home: number;
    top_pick_away: number;
    top_pick_probability: number;
    second_pick: string;
    third_pick: string;
    home_win_pct: number;
    draw_pct: number;
    away_win_pct: number;
    xg_home: number;
    xg_away: number;
    scoreline_matrix: string;
    lineup_adjusted: boolean;
    analysis_text: string | null;
}

interface Performance {
    fixture_id: string;
    predicted_top_pick: string;
    actual_result: string;
    outcome_correct: boolean;
    gameweek: number;
}

interface GafferClientProps {
    user: { nickname: string };
    upcomingPredictions: Prediction[];
    recentPredictions: Prediction[];
    performance: Performance[];
}

const TEAM_CRESTS: Record<string, string> = {
    "Arsenal": "https://crests.football-data.org/57.png",
    "Aston Villa": "https://crests.football-data.org/58.png",
    "Bournemouth": "https://crests.football-data.org/1044.png",
    "Brentford": "https://crests.football-data.org/402.png",
    "Brighton": "https://crests.football-data.org/397.png",
    "Burnley": "https://crests.football-data.org/328.png",
    "Chelsea": "https://crests.football-data.org/61.png",
    "Crystal Palace": "https://crests.football-data.org/354.png",
    "Everton": "https://crests.football-data.org/62.png",
    "Fulham": "https://crests.football-data.org/63.png",
    "Ipswich": "https://crests.football-data.org/349.png",
    "Leeds": "https://crests.football-data.org/341.png",
    "Leicester": "https://crests.football-data.org/338.png",
    "Liverpool": "https://crests.football-data.org/64.png",
    "Man City": "https://crests.football-data.org/65.png",
    "Man United": "https://crests.football-data.org/66.png",
    "Newcastle": "https://crests.football-data.org/67.png",
    "Nott'm Forest": "https://crests.football-data.org/351.png",
    "Southampton": "https://crests.football-data.org/340.png",
    "Sunderland": "https://crests.football-data.org/71.png",
    "Tottenham": "https://crests.football-data.org/73.png",
    "West Ham": "https://crests.football-data.org/563.png",
    "Wolves": "https://crests.football-data.org/76.png",
};

function TeamCrest({ team, size = 44 }: { team: string; size?: number }) {
    const [error, setError] = useState(false);
    const src = TEAM_CRESTS[team];
    if (!src || error) {
        return (
            <div className="rounded-full bg-white/10 flex items-center justify-center font-mono font-bold text-white/50 text-[10px]"
                style={{ width: size, height: size, minWidth: size }}>
                {team.slice(0, 3).toUpperCase()}
            </div>
        );
    }
    return (
        <img src={src} alt={team} onError={() => setError(true)}
            style={{ width: size, height: size, minWidth: size, objectFit: "contain" }} />
    );
}

function formatKickoff(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit"
    });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] font-mono whitespace-nowrap">{children}</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>
    );
}

function XGBar({ team, xg, isHome }: { team: string; xg: number; isHome: boolean }) {
    const widthPct = Math.max((xg / 4) * 100, 3);
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{team}</span>
                <span className="text-[11px] font-bold font-mono text-white">{xg}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: isHome ? "#39FF14" : "rgba(255,255,255,0.35)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                />
            </div>
        </div>
    );
}

function ScoreMatrix({ matrix, homeTeam, awayTeam }: {
    matrix: number[][];
    homeTeam: string;
    awayTeam: string;
}) {
    const maxVal = Math.max(...matrix.flat());
    const cols = matrix[0]?.length ?? 6;
    return (
        <div>
            <div className="flex justify-between mb-2.5">
                <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">{homeTeam} (home)</span>
                <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">{awayTeam} (away)</span>
            </div>
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {matrix.map((row, i) =>
                    row.map((val, j) => {
                        const pct = (val * 100).toFixed(1);
                        const intensity = maxVal > 0 ? val / maxVal : 0;

                        const bg = intensity > 0.85
                            ? "#39FF14"
                            : intensity > 0.65
                            ? `rgba(57,255,20,${0.55 + intensity * 0.3})`
                            : intensity > 0.45
                            ? `rgba(57,255,20,${0.25 + intensity * 0.3})`
                            : intensity > 0.25
                            ? `rgba(57,255,20,${0.08 + intensity * 0.2})`
                            : "rgba(255,255,255,0.04)";

                        const textColor = intensity > 0.45
                            ? "#0A192F"
                            : intensity > 0.25
                            ? "rgba(57,255,20,0.6)"
                            : "rgba(255,255,255,0.3)";

                        const subColor = intensity > 0.45
                            ? "rgba(10,25,47,0.55)"
                            : "rgba(255,255,255,0.2)";

                        return (
                            <div key={`${i}-${j}`}
                                className="rounded p-1.5 text-center"
                                style={{ background: bg }}>
                                <div className="font-mono text-[9px] leading-none"
                                    style={{ color: textColor, fontWeight: intensity > 0.35 ? "700" : "500" }}>
                                    {pct}%
                                </div>
                                <div className="text-[8px] mt-0.5 font-mono"
                                    style={{ color: subColor }}>
                                    {i}-{j}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function AnalysisText({ text }: { text: string }) {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    return (
        <div className="space-y-2">
            {lines.map((line, i) => {
                const isHeader = line.startsWith("**") && line.endsWith("**");
                if (isHeader) return (
                    <p key={i} className="text-[10px] font-bold text-mint uppercase tracking-[0.18em] font-mono pt-4 first:pt-0">
                        {line.replace(/\*\*/g, "")}
                    </p>
                );
                return (
                    <p key={i} className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {line}
                    </p>
                );
            })}
        </div>
    );
}

function GafferChat({ fixtureId }: { fixtureId: string }) {
    const [messages, setMessages] = useState<{ role: "user" | "gaffer"; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === "user" ? "user" as const : "assistant" as const,
                content: m.text,
            }));

            const res = await fetch("/api/gaffer/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fixtureId,
                    message: userMessage,
                    conversationHistory: history,
                }),
            });

            const data = await res.json();
            setMessages(prev => [...prev, { role: "gaffer", text: data.response ?? "No response." }]);
        } catch {
            setMessages(prev => [...prev, { role: "gaffer", text: "Data unavailable. Try again." }]);
        }

        setLoading(false);
        setTimeout(scrollToBottom, 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="mt-2">
            <SectionLabel>Ask The Gaffer</SectionLabel>

            {/* Messages */}
            {messages.length > 0 && (
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[85%] rounded-xl px-3 py-2.5"
                                style={{
                                    background: msg.role === "user"
                                        ? "rgba(57,255,20,0.12)"
                                        : "rgba(255,255,255,0.06)",
                                    border: msg.role === "user"
                                        ? "1px solid rgba(57,255,20,0.2)"
                                        : "1px solid rgba(255,255,255,0.08)"
                                }}>
                                {msg.role === "gaffer" && (
                                    <div className="text-[9px] font-bold font-mono uppercase tracking-[0.2em] mb-1.5"
                                        style={{ color: "rgba(57,255,20,0.5)" }}>
                                        The Gaffer
                                    </div>
                                )}
                                <p className="text-[12px] leading-relaxed font-mono"
                                    style={{ color: msg.role === "user" ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.65)" }}>
                                    {msg.text}
                                </p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="rounded-xl px-3 py-2.5 flex items-center gap-1.5"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {[0, 150, 300].map((d) => (
                                    <div key={d} className="h-1.5 w-1.5 rounded-full bg-mint animate-bounce"
                                        style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this match..."
                    className="flex-1 rounded-xl px-4 py-3 text-[12px] font-mono outline-none"
                    style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.8)",
                    }}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="rounded-xl px-4 py-3 text-[11px] font-bold font-mono uppercase tracking-wider transition-all"
                    style={{
                        background: input.trim() ? "rgba(57,255,20,0.15)" : "rgba(255,255,255,0.04)",
                        border: input.trim() ? "1px solid rgba(57,255,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        color: input.trim() ? "#39FF14" : "rgba(255,255,255,0.25)",
                    }}>
                    Ask
                </button>
            </div>
        </div>
    );
}

function PredictionCard({ prediction, isPast = false }: { prediction: Prediction; isPast?: boolean }) {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(prediction.analysis_text);

    let matrix: number[][] = [];
    try { matrix = JSON.parse(prediction.scoreline_matrix ?? "[]"); } catch { matrix = []; }

    let secondPick = { home: 0, away: 0, probability: 0 };
    let thirdPick = { home: 0, away: 0, probability: 0 };
    try {
        secondPick = JSON.parse(prediction.second_pick ?? "{}");
        thirdPick = JSON.parse(prediction.third_pick ?? "{}");
    } catch { /* ignore */ }

    const maxPct = Math.max(prediction.home_win_pct, prediction.draw_pct, prediction.away_win_pct);

    const handleExpand = async () => {
        const next = !expanded;
        setExpanded(next);
        if (next && !analysis) {
            setLoadingAnalysis(true);
            try {
                const res = await fetch(`/api/gaffer/${prediction.fixture_id}`);
                const data = await res.json();
                if (data.analysis_text) setAnalysis(data.analysis_text);
            } catch { /* ignore */ }
            setLoadingAnalysis(false);
        }
    };

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{
                background: isPast ? "rgba(12,24,46,0.97)" : "rgba(17,34,64,0.97)",
                border: isPast ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.07)",
                marginBottom: "16px"
            }}>

            {/* Gameweek + kickoff */}
            <div className="flex items-center justify-between px-5 pt-4 pb-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">GW{prediction.gameweek}</span>
                    {isPast && <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>Finished</span>}
                </div>
                <span className="text-[10px] font-mono text-white/20">{formatKickoff(prediction.kickoff_time)}</span>
            </div>

            {/* Teams row */}
<div className="px-5 pt-4 pb-4">
    <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={prediction.home_team} size={46} />
            <span className="text-[11px] font-bold text-white text-center leading-tight tracking-wide w-full px-1 truncate">{prediction.home_team}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>vs</span>
        <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={prediction.away_team} size={46} />
            <span className="text-[11px] font-bold text-white text-center leading-tight tracking-wide w-full px-1 truncate">{prediction.away_team}</span>
        </div>
    </div>
</div>

{/* Outcome probabilities */}
<div className="px-5 pb-5 flex gap-2 mt-3">
    {[
        { label: prediction.home_team, pct: prediction.home_win_pct },
        { label: "Draw", pct: prediction.draw_pct },
        { label: prediction.away_team, pct: prediction.away_win_pct },
    ].map((item) => (
        <div key={item.label} className="flex-1 rounded-xl px-2 py-5 text-center"
            style={{
                background: item.pct === maxPct ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
                border: item.pct === maxPct ? "1px solid rgba(57,255,20,0.15)" : "1px solid rgba(255,255,255,0.05)"
            }}>
            <div className="text-[9px] font-mono mb-1.5 truncate px-1" style={{ color: "rgba(255,255,255,0.3)" }}>{item.label}</div>
            <div className={`text-xl font-bold font-mono ${item.pct === maxPct ? "text-mint" : "text-white"}`}>
                {item.pct}%
            </div>
        </div>
    ))}
</div>

{/* Predicted Score ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â secondary */}
<div className="px-5 pb-5 pt-6">
    <div className="rounded-xl px-4 py-3"
        style={{ background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.08)" }}>
        <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: "rgba(57,255,20,0.45)" }}>
                Predicted score
            </span>
            <span className="text-[9px] font-mono" style={{ color: "rgba(57,255,20,0.35)" }}>
                {prediction.top_pick_probability}% probability
            </span>
        </div>
        <div className="text-[13px] font-bold font-mono text-mint text-center">
            {prediction.home_team} {prediction.top_pick_home} - {prediction.top_pick_away} {prediction.away_team}
        </div>
        <div className="text-[9px] font-mono text-center mt-1.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>
            Top pick - open full analysis for all scorelines
        </div>
    </div>
</div>

            {/* Expand button */}
            <div className="px-5 pb-7 pt-4">
                <button
                    onClick={handleExpand}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className="w-full rounded-xl py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center justify-center gap-2 font-mono"
                    style={{
                        background: hovered ? "rgba(57,255,20,0.08)" : "rgba(255,255,255,0.04)",
                        border: hovered ? "1px solid rgba(57,255,20,0.2)" : "1px solid rgba(255,255,255,0.08)",
                        color: hovered ? "#39FF14" : "rgba(255,255,255,0.4)"
                    }}>
                    {expanded ? "Hide Analysis [-]" : "Full Analysis [+]"}
                </button>
            </div>

            {/* Expanded */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.05)" }} />
                        <div className="px-5 py-6 space-y-8">

                            <div style={{ marginTop: "8px" }}>
                                <SectionLabel>Other likely scorelines</SectionLabel>
                                <div className="grid grid-cols-2 gap-2">
                                    {[secondPick, thirdPick].map((pick, idx) => (
                                        <div key={idx} className="rounded-xl px-3 py-3.5 text-center"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                            <div className="text-[11px] font-bold text-white font-mono">
                                                {prediction.home_team} {pick.home} - {pick.away} {prediction.away_team}
                                            </div>
                                            <div className="text-[10px] mt-1.5 font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                                                {pick.probability}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <SectionLabel>xG projection</SectionLabel>
                                <div className="space-y-3">
                                    <XGBar team={prediction.home_team} xg={prediction.xg_home} isHome={true} />
                                    <XGBar team={prediction.away_team} xg={prediction.xg_away} isHome={false} />
                                </div>
                            </div>

                            {matrix.length > 0 && (
                                <div>
                                    <SectionLabel>Scoreline probability matrix</SectionLabel>
                                    <ScoreMatrix matrix={matrix} homeTeam={prediction.home_team} awayTeam={prediction.away_team} />
                                </div>
                            )}

                            <div>
                                <SectionLabel>The Gaffer&apos;s analysis</SectionLabel>
                                {loadingAnalysis ? (
                                    <div className="flex items-center gap-2 py-6">
                                        {[0, 150, 300].map((d) => (
                                            <div key={d} className="h-1.5 w-1.5 rounded-full bg-mint animate-bounce"
                                                style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                        <span className="text-xs font-mono ml-2 tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
                                            Processing data...
                                        </span>
                                    </div>
                                ) : analysis ? (
                                    <AnalysisText text={analysis} />
                                ) : (
                                    <p className="text-xs font-mono italic" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        No analysis available yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PerformanceTracker({ performance }: { performance: Performance[] }) {
    if (performance.length === 0) return null;

    const total = performance.length;
    const correct = performance.filter(p => p.outcome_correct).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (pct / 100) * circumference;

    return (
        <div className="rounded-2xl overflow-hidden mb-8"
            style={{ background: "rgba(17,34,64,0.97)", border: "1px solid rgba(57,255,20,0.12)" }}>

            <div className="px-6 pt-6 pb-5">
                <div className="flex items-center gap-6">

                    {/* Circular ring */}
                    <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
                        <svg width="130" height="130" viewBox="0 0 130 130">
                            {/* Background ring */}
                            <circle
                                cx="65" cy="65" r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.06)"
                                strokeWidth="8"
                            />
                            {/* Progress ring */}
                            <motion.circle
                                cx="65" cy="65" r={radius}
                                fill="none"
                                stroke="#39FF14"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: circumference - strokeDash }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                transform="rotate(-90 65 65)"
                            />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-mint font-mono leading-none">{pct}%</span>
                            <span className="text-[10px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>accurate</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex-1">
                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] font-mono block mb-1" style={{ color: "rgba(57,255,20,0.55)" }}>
                            The Gaffer&apos;s Record
                        </span>
                        <p className="text-[11px] font-mono mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Outcome prediction accuracy
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(57,255,20,0.07)", border: "1px solid rgba(57,255,20,0.1)" }}>
                                <div className="text-xl font-bold text-mint font-mono">{correct}</div>
                                <div className="text-[9px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: "rgba(57,255,20,0.45)" }}>Correct</div>
                            </div>
                            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="text-xl font-bold text-white font-mono">{total - correct}</div>
                                <div className="text-[9px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>Wrong</div>
                            </div>
                        </div>

                        <div className="mt-2 rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="text-xl font-bold text-white font-mono">{total}</div>
                            <div className="text-[9px] font-mono mt-0.5 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>Total predictions</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FloatingGafferChat({ predictions }: { predictions: Prediction[] }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: "user" | "gaffer"; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMessage }]);
        setLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === "user" ? "user" as const : "assistant" as const,
                content: m.text,
            }));

            const res = await fetch("/api/gaffer/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: history,
                    allMatches: predictions.map(p => ({
                        home: p.home_team,
                        away: p.away_team,
                        gameweek: p.gameweek,
                        home_win_pct: p.home_win_pct,
                        draw_pct: p.draw_pct,
                        away_win_pct: p.away_win_pct,
                        top_pick_home: p.top_pick_home,
                        top_pick_away: p.top_pick_away,
                        top_pick_probability: p.top_pick_probability,
                        xg_home: p.xg_home,
                        xg_away: p.xg_away,
                    })),
                }),
            });

            const data = await res.json();
            setMessages(prev => [...prev, { role: "gaffer", text: data.response ?? "Data unavailable." }]);
        } catch {
            setMessages(prev => [...prev, { role: "gaffer", text: "Data unavailable. Try again." }]);
        }

        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "16px",
                    zIndex: 9999,
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(57,255,20,0.4)",
                    boxShadow: "0 0 20px rgba(57,255,20,0.2), 0 8px 24px rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    padding: 0,
                    background: "none",
                }}
            >
                <img src="/gaffer-avatar.png" alt="Ask The Gaffer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => setOpen(false)}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9998,
                    background: "rgba(0,0,0,0.4)",
                }}
            />

            {/* Chat panel */}
            <div style={{
                position: "fixed",
                bottom: "88px",
                right: "16px",
                zIndex: 9999,
                width: "min(380px, calc(100vw - 32px))",
                height: "min(520px, calc(100vh - 140px))",
                background: "rgba(10,25,47,0.98)",
                border: "1px solid rgba(57,255,20,0.15)",
                borderRadius: "20px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                }}>
                    <img src="/gaffer-avatar.png" alt="The Gaffer"
                        style={{ width: 36, height: 36, minWidth: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(57,255,20,0.3)" }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: "bold", color: "white", fontFamily: "monospace", letterSpacing: "0.05em" }}>The Gaffer</div>
                        <div style={{ fontSize: "9px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(57,255,20,0.5)", marginTop: "2px" }}>
                            GW{predictions[0]?.gameweek} - {predictions.length} matches loaded
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: "4px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {messages.length === 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "0 16px" }}>
                            <img src="/gaffer-avatar.png" alt="The Gaffer"
                                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", opacity: 0.6, marginBottom: "16px", border: "1.5px solid rgba(57,255,20,0.2)" }} />
                            <p style={{ fontSize: "11px", fontFamily: "monospace", fontWeight: "bold", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>Ask The Gaffer</p>
                            <p style={{ fontSize: "10px", fontFamily: "monospace", color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
                                Questions about GW{predictions[0]?.gameweek} matches only.
                            </p>
                            <div style={{ marginTop: "16px", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                    "Which match is The Gaffer most confident about?",
                                    "Any matches too close to call?",
                                    "What does the xG say about Newcastle?",
                                ].map((q) => (
                                    <button key={q} onClick={() => setInput(q)}
                                        style={{
                                            textAlign: "left", borderRadius: "12px", padding: "10px 12px",
                                            fontSize: "10px", fontFamily: "monospace", cursor: "pointer",
                                            background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.1)",
                                            color: "rgba(255,255,255,0.45)",
                                        }}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-start", gap: "8px" }}>
                            {msg.role === "gaffer" && (
                                <img src="/gaffer-avatar.png" alt="Gaffer"
                                    style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: "2px", border: "1px solid rgba(57,255,20,0.2)" }} />
                            )}
                            <div style={{
                                maxWidth: "80%", borderRadius: "16px", padding: "10px 12px",
                                background: msg.role === "user" ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.06)",
                                border: msg.role === "user" ? "1px solid rgba(57,255,20,0.18)" : "1px solid rgba(255,255,255,0.07)",
                                borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                                borderBottomLeftRadius: msg.role === "gaffer" ? "4px" : "16px",
                            }}>
                                <p style={{ fontSize: "12px", fontFamily: "monospace", lineHeight: 1.6, color: msg.role === "user" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)", margin: 0 }}>
                                    {msg.text}
                                </p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <img src="/gaffer-avatar.png" alt="Gaffer"
                                style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(57,255,20,0.2)" }} />
                            <div style={{ borderRadius: "16px", padding: "10px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "6px", alignItems: "center" }}>
                                {[0, 150, 300].map((d) => (
                                    <div key={d} className="h-1.5 w-1.5 rounded-full bg-mint animate-bounce"
                                        style={{ animationDelay: `${d}ms` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div style={{
                    padding: "12px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                    display: "flex",
                    gap: "8px",
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about GW matches..."
                        style={{
                            flex: 1, borderRadius: "12px", padding: "10px 14px",
                            fontSize: "12px", fontFamily: "monospace", outline: "none",
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    />
                    <button onClick={sendMessage} disabled={loading || !input.trim()}
                        style={{
                            borderRadius: "12px", padding: "10px 14px",
                            fontSize: "11px", fontFamily: "monospace", fontWeight: "bold",
                            textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer",
                            flexShrink: 0,
                            background: input.trim() ? "rgba(57,255,20,0.15)" : "rgba(255,255,255,0.04)",
                            border: input.trim() ? "1px solid rgba(57,255,20,0.3)" : "1px solid rgba(255,255,255,0.08)",
                            color: input.trim() ? "#39FF14" : "rgba(255,255,255,0.25)",
                        }}>
                        Send
                    </button>
                </div>
            </div>

            {/* Avatar button when open */}
            <button
                onClick={() => setOpen(false)}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "16px",
                    zIndex: 9999,
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid rgba(57,255,20,0.4)",
                    boxShadow: "0 0 20px rgba(57,255,20,0.2), 0 8px 24px rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    padding: 0,
                    background: "none",
                }}
            >
                <img src="/gaffer-avatar.png" alt="Ask The Gaffer"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
        </>
    );
}

export default function GafferClient({ user, upcomingPredictions, recentPredictions, performance }: GafferClientProps) {
    return (
        <div className="min-h-screen" style={{ background: "#0A192F" }}>
            <DashboardHeader nickname={user.nickname} />
            <main className="mx-auto max-w-2xl px-4 py-8">

                {/* Hero */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
                        style={{ background: "rgba(57,255,20,0.07)", border: "1px solid rgba(57,255,20,0.15)" }}>
                        <span className="text-[10px] font-bold text-mint uppercase tracking-[0.22em] font-mono">AI Prediction Engine</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight font-mono">The Gaffer</h1>
                    <p className="text-sm max-w-xs mx-auto leading-relaxed font-mono tracking-wide" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Cold data. No bias. Just football.
                    </p>
                </div>

                {/* Performance tracker */}
                <PerformanceTracker performance={performance} />

                {/* Upcoming */}
                {upcomingPredictions.length > 0 ? (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Upcoming</span>
                            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{upcomingPredictions.length} matches</span>
                        </div>
                        {upcomingPredictions.map((pred) => (
                            <PredictionCard key={pred.fixture_id} prediction={pred} isPast={false} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 mb-8">
                        <p className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>No upcoming predictions.</p>
                        <p className="text-xs mt-1 font-mono" style={{ color: "rgba(255,255,255,0.1)" }}>The Gaffer updates every Tuesday.</p>
                    </div>
                )}

                {/* Recent matches */}
                {recentPredictions.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Recent</span>
                            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{recentPredictions.length} matches</span>
                        </div>
                        {recentPredictions.map((pred) => (
                            <PredictionCard key={pred.fixture_id} prediction={pred} isPast={true} />
                        ))}
                    </div>
                )}
            </main>

            <FloatingGafferChat predictions={[...upcomingPredictions, ...recentPredictions]} />
        </div>
    );
}

