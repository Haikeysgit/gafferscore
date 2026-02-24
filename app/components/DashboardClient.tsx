"use client";

import { useState, useEffect, useTransition } from "react";
import DashboardHeader from "@/app/components/DashboardHeader";
import GameweekNav from "@/app/components/GameweekNav";
import MatchCard from "@/app/components/MatchCard";
import Footer from "@/app/components/Footer";
import {
    type FixtureData,
    type PredictionData,
    type GameweekData,
    getFixtures,
    getUserPredictions,
    savePrediction,
} from "@/lib/actions";

interface DashboardClientProps {
    nickname: string;
    gameweeks: GameweekData[];
    initialGameweekId: number;
    initialFixtures: FixtureData[];
    initialPredictions: PredictionData[];
}

export default function DashboardClient({
    nickname,
    gameweeks,
    initialGameweekId,
    initialFixtures,
    initialPredictions,
}: DashboardClientProps) {
    const [currentGameweekId, setCurrentGameweekId] = useState(initialGameweekId);
    const [fixtures, setFixtures] = useState(initialFixtures);
    const [predictions, setPredictions] = useState(initialPredictions);
    const [isPending, startTransition] = useTransition();

    // ── Live score polling: refresh fixtures every 60s when matches are live ──
    const hasLiveMatches = fixtures.some((f) => f.status === "live");

    useEffect(() => {
        if (!hasLiveMatches) return;

        const interval = setInterval(async () => {
            try {
                const fresh = await getFixtures(currentGameweekId);
                setFixtures(fresh);
            } catch (e) {
                console.error("[poll] Failed to refresh fixtures:", e);
            }
        }, 60_000);

        return () => clearInterval(interval);
    }, [currentGameweekId, hasLiveMatches]);

    // Find the gameweek index for navigation
    const gwIndex = gameweeks.findIndex((g) => g.id === currentGameweekId);
    const currentGw = gameweeks[gwIndex];
    const totalGameweeks = gameweeks.length;

    // Build a prediction lookup: fixture_id -> prediction
    const predMap = new Map(predictions.map((p) => [p.fixture_id, p]));

    const switchGameweek = (direction: "prev" | "next") => {
        const newIndex = direction === "prev"
            ? Math.max(0, gwIndex - 1)
            : Math.min(gameweeks.length - 1, gwIndex + 1);

        const newGw = gameweeks[newIndex];
        if (newGw.id === currentGameweekId) return;

        setCurrentGameweekId(newGw.id);

        startTransition(async () => {
            const [newFixtures, newPredictions] = await Promise.all([
                getFixtures(newGw.id),
                getUserPredictions(newGw.id),
            ]);
            setFixtures(newFixtures);
            setPredictions(newPredictions);
        });
    };

    const handleSave = async (
        fixtureId: number,
        homeScore: number,
        awayScore: number
    ): Promise<{ success: boolean; error?: string }> => {
        const result = await savePrediction(fixtureId, homeScore, awayScore);
        if (result.success) {
            // Refresh predictions to get the latest state
            const updated = await getUserPredictions(currentGameweekId);
            setPredictions(updated);
        }
        return result;
    };

    return (
        <div className="flex min-h-screen flex-col bg-navy">
            {/* Atmospheric background: players image fading into navy */}
            <div
                className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[500px] bg-contain bg-top bg-no-repeat"
                style={{
                    backgroundImage: "url('/4 players header.png')",
                    backgroundPosition: "center 80px",
                    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
                }}
                aria-hidden="true"
            />

            {/* Slim Glass Header */}
            <DashboardHeader nickname={nickname} />

            {/* Main Content */}
            <main className="relative z-10 flex-1">
                {/* Gameweek Navigation */}
                <GameweekNav
                    currentGameweek={currentGw ? parseInt(currentGw.name.replace(/\D/g, "")) || (gwIndex + 1) : gwIndex + 1}
                    totalGameweeks={totalGameweeks > 0 ? gameweeks[gameweeks.length - 1]?.id || totalGameweeks : 38}
                    onPrev={() => switchGameweek("prev")}
                    onNext={() => switchGameweek("next")}
                />

                {/* Loading overlay */}
                {isPending && (
                    <div className="flex justify-center py-8">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30">
                            Loading...
                        </div>
                    </div>
                )}

                {/* Match Cards - Two column grid on desktop, single column on mobile */}
                <div className="grid grid-cols-1 gap-3 px-3 pb-12 md:mx-auto md:max-w-6xl md:grid-cols-2 md:gap-4 md:px-6">
                    {fixtures.map((fixture) => {
                        const pred = predMap.get(fixture.id);
                        return (
                            <MatchCard
                                key={fixture.id}
                                fixtureId={fixture.id}
                                homeTeam={fixture.home_team}
                                awayTeam={fixture.away_team}
                                homeShort={fixture.home_short}
                                awayShort={fixture.away_short}
                                homeLogo={fixture.home_logo ?? undefined}
                                awayLogo={fixture.away_logo ?? undefined}
                                kickoffTime={fixture.kickoff_time}
                                status={fixture.status}
                                actualHomeScore={fixture.home_score ?? undefined}
                                actualAwayScore={fixture.away_score ?? undefined}
                                initialHomeScore={pred ? pred.predicted_home_score : 0}
                                initialAwayScore={pred ? pred.predicted_away_score : 0}
                                initialSaved={!!pred}
                                pointsEarned={pred && fixture.status === "finished" ? pred.points_earned : undefined}
                                onSave={handleSave}
                            />
                        );
                    })}
                </div>
            </main>

            {/* Footer */}
            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
