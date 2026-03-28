"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/app/components/DashboardHeader";

interface Prediction {
    fixture_id: string;
    home_team: string;
    away_team: string;
    home_logo?: string | null;
    away_logo?: string | null;
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

type CombinedFixture = Partial<Prediction> & {
    fixture_id: string;
    home_team: string;
    away_team: string;
    home_logo?: string | null;
    away_logo?: string | null;
    kickoff_time: string;
    gameweek?: number | string | null;
    gameweek_id?: number | string | null;
    matchday?: number | string | null;
    status?: string | null;
    home_score?: number | null;
    away_score?: number | null;
    prediction?: Prediction | null;
    performance?: Performance | null;
};

type PredictedFixture = CombinedFixture & Prediction;

interface GameweekMatrixMetrics {
    averageMatrixHit: number;
    finishedCount: number;
    highestHitFixtureIds: string[];
    highestHitMatch: {
        awayLogo?: string | null;
        awayTeam: string;
        homeLogo?: string | null;
        homeTeam: string;
    } | null;
    highestMatrixHit: number;
    topThreeHitRate: number;
}

function isFixturePredicted(fixture: CombinedFixture): fixture is PredictedFixture {
    return (
        typeof fixture.top_pick_home === "number" &&
        typeof fixture.top_pick_away === "number" &&
        typeof fixture.top_pick_probability === "number" &&
        typeof fixture.home_win_pct === "number" &&
        typeof fixture.draw_pct === "number" &&
        typeof fixture.away_win_pct === "number" &&
        typeof fixture.xg_home === "number" &&
        typeof fixture.xg_away === "number" &&
        typeof fixture.scoreline_matrix === "string" &&
        typeof fixture.second_pick === "string" &&
        typeof fixture.third_pick === "string" &&
        typeof fixture.lineup_adjusted === "boolean" &&
        (fixture.analysis_text === null || typeof fixture.analysis_text === "string")
    );
}

function parseScorelineMatrix(scorelineMatrix: string): number[][] {
    try {
        const parsed = JSON.parse(scorelineMatrix) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((row) => {
            if (!Array.isArray(row)) {
                return [];
            }

            return row.map((value) => {
                const parsedValue = Number(value);
                return Number.isFinite(parsedValue) ? parsedValue : 0;
            });
        });
    } catch {
        return [];
    }
}

function getActualMatrixHit(fixture: Pick<CombinedFixture, "home_score" | "away_score" | "scoreline_matrix">): number | null {
    if (
        typeof fixture.home_score !== "number" ||
        typeof fixture.away_score !== "number" ||
        typeof fixture.scoreline_matrix !== "string"
    ) {
        return null;
    }

    const matrix = parseScorelineMatrix(fixture.scoreline_matrix);
    const probability = (matrix[fixture.home_score] ?? [])[fixture.away_score];

    if (typeof probability !== "number" || !Number.isFinite(probability)) {
        return null;
    }

    return probability * 100;
}

function isTopThreeMatrixHit(fixture: Pick<CombinedFixture, "home_score" | "away_score" | "scoreline_matrix">): boolean {
    if (
        typeof fixture.home_score !== "number" ||
        typeof fixture.away_score !== "number" ||
        typeof fixture.scoreline_matrix !== "string"
    ) {
        return false;
    }

    const matrix = parseScorelineMatrix(fixture.scoreline_matrix);
    const actualScoreKey = `${fixture.home_score}-${fixture.away_score}`;

    return matrix
        .flatMap((row, homeGoals) =>
            row.map((probability, awayGoals) => ({
                probability,
                scoreKey: `${homeGoals}-${awayGoals}`,
            })),
        )
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 3)
        .some((entry) => entry.scoreKey === actualScoreKey);
}

function calculateGameweekMatrixMetrics(fixtures: CombinedFixture[]): GameweekMatrixMetrics {
    const finishedFixtures = fixtures.filter(
        (fixture): fixture is PredictedFixture & { home_score: number; away_score: number } =>
            isFixturePredicted(fixture) &&
            fixture.status?.toUpperCase() === "FINISHED" &&
            typeof fixture.home_score === "number" &&
            typeof fixture.away_score === "number",
    );

    if (finishedFixtures.length === 0) {
        return {
            averageMatrixHit: 0,
            finishedCount: 0,
            highestHitFixtureIds: [],
            highestHitMatch: null,
            highestMatrixHit: 0,
            topThreeHitRate: 0,
        };
    }

    let highestMatrixHit = 0;
    let highestHitFixtureIds: string[] = [];
    let highestHitMatch: GameweekMatrixMetrics["highestHitMatch"] = null;
    let totalMatrixHit = 0;
    let topThreeHits = 0;

    for (const fixture of finishedFixtures) {
        const actualMatrixHit = getActualMatrixHit(fixture) ?? 0;

        if (actualMatrixHit > highestMatrixHit) {
            highestMatrixHit = actualMatrixHit;
            highestHitFixtureIds = [fixture.fixture_id];
            highestHitMatch = {
                awayLogo: fixture.away_logo,
                awayTeam: fixture.away_team,
                homeLogo: fixture.home_logo,
                homeTeam: fixture.home_team,
            };
        } else if (actualMatrixHit === highestMatrixHit) {
            highestHitFixtureIds.push(fixture.fixture_id);
        }
        totalMatrixHit += actualMatrixHit;

        if (isTopThreeMatrixHit(fixture)) {
            topThreeHits += 1;
        }
    }

    return {
        averageMatrixHit: totalMatrixHit / finishedFixtures.length,
        finishedCount: finishedFixtures.length,
        highestHitFixtureIds,
        highestHitMatch,
        highestMatrixHit,
        topThreeHitRate: (topThreeHits / finishedFixtures.length) * 100,
    };
}

interface GafferClientProps {
    user: { nickname: string };
    fixtures: CombinedFixture[];
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
    "Manchester City": "https://crests.football-data.org/65.png",
    "Man United": "https://crests.football-data.org/66.png",
    "Manchester United": "https://crests.football-data.org/66.png",
    "Newcastle": "https://crests.football-data.org/67.png",
    "Newcastle United": "https://crests.football-data.org/67.png",
    "Nott'm Forest": "https://crests.football-data.org/351.png",
    "Nottingham Forest": "https://crests.football-data.org/351.png",
    "Southampton": "https://crests.football-data.org/340.png",
    "Sunderland": "https://crests.football-data.org/71.png",
    "Sunderland AFC": "https://crests.football-data.org/71.png",
    "Tottenham": "https://crests.football-data.org/73.png",
    "Tottenham Hotspur": "https://crests.football-data.org/73.png",
    "West Ham": "https://crests.football-data.org/563.png",
    "West Ham United": "https://crests.football-data.org/563.png",
    "Wolves": "https://crests.football-data.org/76.png",
    "Wolverhampton Wanderers": "https://crests.football-data.org/76.png",
    "Leeds United": "https://crests.football-data.org/341.png",
};

function TeamCrest({ team, logoUrl, size = 44 }: { team: string; logoUrl?: string | null; size?: number }) {
    const [error, setError] = useState(false);
    const src = logoUrl || TEAM_CRESTS[team];
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

function InfoTooltip({
    content,
    align = "center",
}: {
    content: string;
    align?: "center" | "right";
}) {
    const [open, setOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateViewportMode = () => {
            setIsMobileViewport(window.innerWidth < 640);
        };

        updateViewportMode();
        window.addEventListener("resize", updateViewportMode);

        return () => window.removeEventListener("resize", updateViewportMode);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!tooltipRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [open]);

    const tooltipWidth = isMobileViewport ? "190px" : "280px";

    return (
        <div
            ref={tooltipRef}
            className="relative flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label="Explain metric"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                className="flex shrink-0 items-center justify-center transition-colors"
                style={{
                    width: "15px",
                    height: "15px",
                    minWidth: "15px",
                    minHeight: "15px",
                    padding: 0,
                    borderRadius: "50%",
                    background: open ? "rgba(30,41,59,0.98)" : "rgba(30,41,59,0.92)",
                    border: "1px solid rgba(148,163,184,0.3)",
                    boxShadow: open ? "0 8px 18px rgba(0,0,0,0.28)" : "none",
                    color: open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.82)",
                    outline: "none",
                }}
            >
                <span
                    className="font-mono italic leading-none"
                    style={{ fontSize: "7px", transform: "translateY(-0.25px)" }}
                >
                    i
                </span>
            </button>

            {open && (
                <div
                    className={`absolute bottom-full z-[80] mb-3 rounded-2xl text-white shadow-2xl ${
                        align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
                    }`}
                    style={{
                        background: "rgba(8,15,29,0.96)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 18px 36px rgba(0,0,0,0.4)",
                        width: tooltipWidth,
                        maxWidth: isMobileViewport ? tooltipWidth : "90vw",
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: "10px",
                        lineHeight: "1.55",
                        whiteSpace: "normal",
                        wordBreak: "normal",
                        overflowWrap: "break-word",
                    }}
                >
                    <div>{content}</div>
                    <div
                        className={`absolute top-full h-3 w-3 -translate-y-1/2 rotate-45 ${
                            align === "right" ? "right-[3px]" : "left-1/2 -translate-x-1/2"
                        }`}
                        style={{
                            background: "rgba(8,15,29,0.96)",
                            borderRight: "1px solid rgba(255,255,255,0.08)",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                    />
                </div>
            )}
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

function CountdownTimer({ targetDate }: { targetDate: Date | number | string }) {
    const getTimeRemaining = () => {
        const targetTime = new Date(targetDate).getTime();
        const diff = targetTime - Date.now();

        if (!Number.isFinite(targetTime) || diff <= 0) {
            return null;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
    };

    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

    useEffect(() => {
        const updateTimeRemaining = () => {
            setTimeRemaining(getTimeRemaining());
        };

        updateTimeRemaining();

        const intervalId = window.setInterval(() => {
            updateTimeRemaining();
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [targetDate]);

    return <>{timeRemaining ?? "Predicting..."}</>;
}

function PredictionCard({
    fixture,
    isPast = false,
    isMatchOfTheWeek = false,
}: {
    fixture: CombinedFixture;
    isPast?: boolean;
    isMatchOfTheWeek?: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(fixture.analysis_text ?? null);
    const isLocked = !isFixturePredicted(fixture);
    const cardGameweek = Number(fixture.gameweek ?? fixture.gameweek_id ?? 0);
    const unlockTime = new Date(new Date(fixture.kickoff_time).getTime() - 14 * 24 * 60 * 60 * 1000);

    if (isLocked) {
        return (
            <div
                className="rounded-2xl overflow-hidden"
                style={{
                    background: "#0f2038",
                    border: "1px solid rgba(255,255,255,0.07)",
                    marginBottom: "16px",
                }}
            >
                <div className="flex items-center justify-between px-5 pt-4 pb-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">GW{cardGameweek}</span>
                        <span
                            className="text-[9px] font-mono text-white/20 uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                            Locked
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-white/20">{formatKickoff(fixture.kickoff_time)}</span>
                </div>

                <div className="px-5 pt-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col items-center gap-2 flex-1">
                            <TeamCrest team={fixture.home_team} logoUrl={fixture.home_logo} size={46} />
                                <span className="text-[11px] font-bold text-white text-center leading-tight tracking-wide w-full px-1 truncate">{fixture.home_team}</span>
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>vs</span>
                            <div className="flex flex-col items-center gap-2 flex-1">
                            <TeamCrest team={fixture.away_team} logoUrl={fixture.away_logo} size={46} />
                                <span className="text-[11px] font-bold text-white text-center leading-tight tracking-wide w-full px-1 truncate">{fixture.away_team}</span>
                            </div>
                        </div>
                    </div>

                <div className="mx-4 mt-2 mb-4">
                    <div
                        className="relative min-h-[180px] rounded-[26px] border border-slate-700/50 shadow-inner px-8 py-8 text-center"
                        style={{
                            background: "#1f3657",
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-4 opacity-100 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.85)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>

                        <span className="block text-sm font-semibold tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>
                            Prediction Unlocks In
                        </span>

                        <div className="text-lg md:text-xl font-mono font-bold tracking-wide leading-tight" style={{ color: "#ffffff" }}>
                            <CountdownTimer targetDate={unlockTime} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const prediction = fixture;
    const actualMatrixHit = getActualMatrixHit(prediction);
    const hasActualResult =
        typeof prediction.home_score === "number" &&
        typeof prediction.away_score === "number" &&
        prediction.status?.toUpperCase() === "FINISHED";
    const isTopThreeHit = hasActualResult ? isTopThreeMatrixHit(prediction) : false;

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
                    {isMatchOfTheWeek && (
                        <span
                            className="text-[9px] font-mono font-bold uppercase tracking-[0.16em] px-2 py-0.5 rounded-full"
                            style={{
                                background: "rgba(57,255,20,0.11)",
                                border: "1px solid rgba(57,255,20,0.22)",
                                color: "#39FF14",
                            }}
                        >
                            Match of the Week
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-mono text-white/20">{formatKickoff(prediction.kickoff_time)}</span>
            </div>

            {/* Teams row */}
<div className="px-5 pt-4 pb-4">
    <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={prediction.home_team} logoUrl={prediction.home_logo} size={46} />
            <span className="text-[11px] font-bold text-white text-center leading-tight tracking-wide w-full px-1 truncate">{prediction.home_team}</span>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>vs</span>
        <div className="flex flex-col items-center gap-2 flex-1">
            <TeamCrest team={prediction.away_team} logoUrl={prediction.away_logo} size={46} />
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
    {hasActualResult ? (
        <div
            className="rounded-2xl px-4 py-4"
            style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.22em] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
                        Actual Result
                    </div>
                    <div className="mt-2 text-2xl font-bold font-mono text-white">
                        {prediction.home_score} - {prediction.away_score}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {isTopThreeHit && (
                        <div
                            className="rounded-full px-2.5 py-1 text-[8px] font-bold font-mono uppercase tracking-[0.18em]"
                            style={{
                                background: "rgba(8,45,24,0.92)",
                                border: "1px solid rgba(57,255,20,0.2)",
                                color: "#39FF14",
                            }}
                        >
                            Top 3 Hit
                        </div>
                    )}
                    {isMatchOfTheWeek && (
                        <div
                            className="rounded-full px-2.5 py-1 text-[8px] font-bold font-mono uppercase tracking-[0.18em]"
                            style={{
                                background: "rgba(57,255,20,0.11)",
                                border: "1px solid rgba(57,255,20,0.22)",
                                color: "#39FF14",
                            }}
                        >
                            Match of the Week
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            <div className="mt-4">
                <div className="text-[9px] font-bold uppercase tracking-[0.22em] font-mono" style={{ color: "rgba(255,255,255,0.28)" }}>
                    Model Probability
                </div>
                <div className="mt-2 text-lg font-bold font-mono text-mint">
                    {actualMatrixHit && actualMatrixHit >= 1
                        ? formatDashboardPercentage(actualMatrixHit)
                        : "Less than 1 percent"}
                </div>
                <div className="mt-1.5 text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Probability assigned to the exact final score
                </div>
            </div>
        </div>
    ) : (
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
    )}
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

function formatDashboardPercentage(value: number) {
    const rounded = Math.round(value * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatTrendDelta(value: number) {
    const rounded = Math.round(Math.abs(value) * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function PerformanceTracker({
    metrics,
    gameweek,
    averageMatrixHitTrend,
}: {
    metrics: GameweekMatrixMetrics;
    gameweek: number;
    averageMatrixHitTrend: number | null;
}) {
    const hasFinishedMatches = metrics.finishedCount > 0;
    const metricCards = [
        {
            accent: "linear-gradient(180deg, rgba(57,255,20,0.16) 0%, rgba(57,255,20,0.1) 100%)",
            border: "rgba(57,255,20,0.18)",
            countTone: "rgba(57,255,20,0.32)",
            footer: null,
            footerText: null,
            label: "Top 3 Hit Rate",
            tone: "text-mint",
            trendText: null,
            tooltipAlign: "center",
            tooltip: "This shows the percentage of matches where the real final score was one of the AI engine's three most likely predictions.",
            value: formatDashboardPercentage(metrics.topThreeHitRate),
        },
        {
            accent: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.035) 100%)",
            border: "rgba(255,255,255,0.08)",
            countTone: "rgba(255,255,255,0.24)",
            footer: metrics.highestHitMatch,
            footerText: null,
            label: "Highest Matrix Hit",
            tone: "text-white",
            trendText: null,
            tooltipAlign: "center",
            tooltip: "This is the single highest probability percentage the AI gave to a scoreline that actually happened this week.",
            value: formatDashboardPercentage(metrics.highestMatrixHit),
        },
        {
            accent: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.035) 100%)",
            border: "rgba(255,255,255,0.08)",
            countTone: "rgba(255,255,255,0.24)",
            footer: null,
            footerText: "League Consistency Score",
            label: "Average Matrix Hit",
            tone: "text-white",
            trendText:
                averageMatrixHitTrend === null
                    ? null
                    : `${averageMatrixHitTrend >= 0 ? "up" : "down"} ${formatTrendDelta(averageMatrixHitTrend)} from last week`,
            trendTone: averageMatrixHitTrend === null || averageMatrixHitTrend >= 0 ? "#39FF14" : "#f87171",
            trendSurface:
                averageMatrixHitTrend === null || averageMatrixHitTrend >= 0
                    ? "rgba(57,255,20,0.1)"
                    : "rgba(248,113,113,0.12)",
            trendBorder:
                averageMatrixHitTrend === null || averageMatrixHitTrend >= 0
                    ? "1px solid rgba(57,255,20,0.16)"
                    : "1px solid rgba(248,113,113,0.2)",
            tooltipAlign: "right",
            tooltip: "This is the average probability the AI assigned to all the actual real world results for this gameweek.",
            value: formatDashboardPercentage(metrics.averageMatrixHit),
        },
    ];

    return (
        <div className="rounded-2xl overflow-hidden mb-8"
            style={{ background: "rgba(17,34,64,0.97)", border: "1px solid rgba(57,255,20,0.12)" }}>

            <div className="px-8 py-8 md:px-10 md:py-10">
                <div className="space-y-8">
                    <div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.25em] font-mono block mb-1" style={{ color: "rgba(57,255,20,0.55)" }}>
                            The Gaffer&apos;s Record
                        </span>
                        <p className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {hasFinishedMatches
                                ? `Probability hits on real scorelines for GW ${gameweek}`
                                : `No finished matches in GW ${gameweek} yet`}
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {metricCards.map((card) => (
                            <div
                                key={card.label}
                                className="flex min-h-[188px] flex-col rounded-[28px] p-8"
                                style={{
                                    background: card.accent,
                                    border: `1px solid ${card.border}`,
                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 16px 32px rgba(4,10,22,0.12)",
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono leading-[1.7]" style={{ color: "rgba(255,255,255,0.34)" }}>
                                        {card.label}
                                    </div>
                                    <InfoTooltip content={card.tooltip} align={card.tooltipAlign as "center" | "right"} />
                                </div>
                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    <div className={`text-[2.2rem] font-bold font-mono leading-none ${card.tone}`}>
                                        {card.value}
                                    </div>
                                    {card.trendText && (
                                        <div
                                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.16em]"
                                            style={{
                                                background: card.trendSurface,
                                                border: card.trendBorder,
                                                color: card.trendTone,
                                            }}
                                        >
                                            <span aria-hidden="true">{card.trendText.startsWith("down") ? "↓" : "↑"}</span>
                                            <span>{card.trendText}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-5 text-[10px] font-mono uppercase tracking-[0.24em] leading-[1.7]" style={{ color: card.countTone }}>
                                    {hasFinishedMatches ? `${metrics.finishedCount} finished matches` : "Awaiting full-time data"}
                                </div>
                                {card.footer && (
                                    <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                                        <div className="min-w-0 text-[10px] font-mono uppercase tracking-[0.18em] leading-[1.5]" style={{ color: "rgba(255,255,255,0.26)" }}>
                                            {card.footer.homeTeam} vs {card.footer.awayTeam}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <TeamCrest team={card.footer.homeTeam} logoUrl={card.footer.homeLogo} size={16} />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.2)" }}>
                                                v
                                            </span>
                                            <TeamCrest team={card.footer.awayTeam} logoUrl={card.footer.awayLogo} size={16} />
                                        </div>
                                    </div>
                                )}
                                {!card.footer && card.footerText && (
                                    <div className="mt-auto border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] leading-[1.5]" style={{ color: "rgba(255,255,255,0.26)" }}>
                                            {card.footerText}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
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

export default function GafferClient(props: GafferClientProps) {
    const { user, fixtures } = props;

    const getFixtureGameweek = (fixture: CombinedFixture) => {
        const candidates = [
            fixture.gameweek_id,
            fixture.gameweek,
            fixture.matchday,
            fixture.prediction?.gameweek,
            fixture.performance?.gameweek,
        ];

        for (const candidate of candidates) {
            const parsed = Number(candidate);
            if (Number.isInteger(parsed) && parsed > 0) {
                return parsed;
            }
        }

        return null;
    };

    const getCurrentRealGameweek = () => {
        if (fixtures.length === 0) return 31;

        const now = new Date();
        const fixturesByKickoff = [...fixtures]
            .map((fixture) => ({
                fixture,
                kickoffTime: new Date(fixture.kickoff_time),
                gameweek: getFixtureGameweek(fixture),
            }))
            .filter(
                (entry) => !Number.isNaN(entry.kickoffTime.getTime()) && entry.gameweek !== null,
            )
            .sort((a, b) => a.kickoffTime.getTime() - b.kickoffTime.getTime());

        if (fixturesByKickoff.length === 0) {
            return 31;
        }

        const upcomingFixture = fixturesByKickoff.find(
            (fixture) => fixture.kickoffTime > now,
        );

        if (upcomingFixture) {
            return upcomingFixture.gameweek ?? 31;
        }

        const mostRecentCompletedFixture = [...fixturesByKickoff]
            .reverse()
            .find((fixture) => fixture.kickoffTime <= now);

        return mostRecentCompletedFixture?.gameweek ?? fixturesByKickoff[0]?.gameweek ?? 31;
    };

    const getGameweekStatusLabel = (currentRealGameweek: number) => {
        if (selectedGameweek < currentRealGameweek) {
            return "Historical Results";
        }

        if (selectedGameweek === currentRealGameweek) {
            return "Active Predictions";
        }

        return "Locked";
    };

    const [selectedGameweek, setSelectedGameweek] = useState<number>(() => getCurrentRealGameweek());

    useEffect(() => {
        setSelectedGameweek(getCurrentRealGameweek());
    }, [fixtures]);

    const currentRealGameweek = getCurrentRealGameweek();
    const gameweekStatusLabel = getGameweekStatusLabel(currentRealGameweek);
    const predictions = fixtures.filter(isFixturePredicted);
    const getFixturesForGameweek = (gameweek: number) =>
        fixtures.filter((fixture) => {
            const gw =
                fixture.gameweek_id ||
                fixture.gameweek ||
                fixture.matchday ||
                fixture.prediction?.gameweek ||
                fixture.performance?.gameweek;
            return Number(gw) === Number(gameweek);
        });

    const filteredFixtures = getFixturesForGameweek(selectedGameweek);
    const selectedGameweekMetrics = calculateGameweekMatrixMetrics(filteredFixtures);
    let previousTrackedMetrics: GameweekMatrixMetrics | null = null;

    for (let gameweek = selectedGameweek - 1; gameweek >= 1; gameweek -= 1) {
        const previousMetrics = calculateGameweekMatrixMetrics(getFixturesForGameweek(gameweek));
        if (previousMetrics.finishedCount > 0) {
            previousTrackedMetrics = previousMetrics;
            break;
        }
    }

    const averageMatrixHitTrend =
        selectedGameweekMetrics.finishedCount > 0 && previousTrackedMetrics
            ? selectedGameweekMetrics.averageMatrixHit - previousTrackedMetrics.averageMatrixHit
            : null;
    const selectedFixtures = filteredFixtures
        .filter((fixture) => isFixturePredicted(fixture) || new Date(fixture.kickoff_time) > new Date())
        .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
    const now = Date.now();

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
                <PerformanceTracker
                    metrics={selectedGameweekMetrics}
                    gameweek={selectedGameweek}
                    averageMatrixHitTrend={averageMatrixHitTrend}
                />

                <div className="mb-8 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => setSelectedGameweek((prev) => Math.max(1, prev - 1))}
                        disabled={selectedGameweek === 1}
                        className="flex h-11 w-11 items-center justify-center rounded-full transition-all"
                        style={{
                            background: selectedGameweek === 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                            border: selectedGameweek === 1 ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.1)",
                            color: selectedGameweek === 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.72)",
                            cursor: selectedGameweek === 1 ? "not-allowed" : "pointer",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="text-lg font-bold text-white font-mono tracking-[0.14em]">
                            THE GAFFER: GW {selectedGameweek}
                        </div>
                        <div
                            className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em]"
                            style={{ color: "rgba(255,255,255,0.32)" }}
                        >
                            {gameweekStatusLabel}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelectedGameweek((prev) => Math.min(38, prev + 1))}
                        disabled={selectedGameweek === 38}
                        className="flex h-11 w-11 items-center justify-center rounded-full transition-all"
                        style={{
                            background: selectedGameweek === 38 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                            border: selectedGameweek === 38 ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.1)",
                            color: selectedGameweek === 38 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.72)",
                            cursor: selectedGameweek === 38 ? "not-allowed" : "pointer",
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>

                {selectedFixtures.length > 0 ? (
                    <div className="mb-8">
                        {selectedFixtures.map((fixture) => {
                            const fixtureGameweek = getFixtureGameweek(fixture) ?? selectedGameweek;
                            const fixtureStatus = fixture.status?.toUpperCase();
                            const isPast =
                                selectedGameweek < currentRealGameweek ||
                                fixtureStatus === "FINISHED" ||
                                fixtureStatus === "FT" ||
                                new Date(fixture.kickoff_time).getTime() < now;

                            return (
                                <PredictionCard
                                    key={fixture.fixture_id}
                                    fixture={{
                                        ...fixture,
                                        gameweek: fixtureGameweek,
                                        analysis_text: fixture.analysis_text ?? null,
                                    }}
                                    isPast={isPast}
                                    isMatchOfTheWeek={
                                        selectedGameweekMetrics.highestMatrixHit > 0 &&
                                        selectedGameweekMetrics.highestHitFixtureIds.includes(fixture.fixture_id)
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 mb-8">
                        <p className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>No matches available for this gameweek.</p>
                        <p className="text-xs mt-1 font-mono" style={{ color: "rgba(255,255,255,0.1)" }}>Try another gameweek.</p>
                    </div>
                )}
            </main>

            <FloatingGafferChat predictions={predictions} />
        </div>
    );
}

