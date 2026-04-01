import TeamCrest from "@/app/components/TeamCrest";
import type { ManagerHistoryMatch } from "@/lib/actions";

interface ManagerHistoryCardProps {
    match: ManagerHistoryMatch;
    managerLabel: string;
}

function TeamBadge({
    short,
    logo,
    align,
}: {
    short: string;
    logo: string | null;
    align: "left" | "right";
}) {
    return (
        <div className={`flex w-16 shrink-0 flex-col items-center gap-1 ${align === "left" ? "text-left" : "text-right"}`}>
            <TeamCrest
                short={short}
                logo={logo}
                sizeClassName="h-11 w-11"
                imageClassName="h-7 w-7 object-contain"
                fallbackTextClassName="text-[10px] font-bold text-white/[0.8]"
            />
            <span
                className="team-label text-[10px] font-semibold"
                style={{ color: "rgba(255, 255, 255, 0.72)" }}
            >
                {short}
            </span>
        </div>
    );
}

export default function ManagerHistoryCard({
    match,
    managerLabel,
}: ManagerHistoryCardProps) {
    const predictionLabel = match.hasPrediction
        ? `${match.predictedHomeScore} - ${match.predictedAwayScore}`
        : "No prediction";
    const pointsTone =
        match.pointsEarned === 50
            ? {
                backgroundColor: "rgba(57, 255, 20, 0.14)",
                color: "rgb(57, 255, 20)",
            }
            : match.pointsEarned === 20
                ? {
                    backgroundColor: "rgba(96, 165, 250, 0.16)",
                    color: "rgb(147, 197, 253)",
                }
                : {
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    color: "rgba(255, 255, 255, 0.72)",
                };

    const kickoffLabel = new Date(match.kickoffTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });

    return (
        <div className="glass-card overflow-hidden rounded-[24px] border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between px-3 py-4 md:px-5 md:py-5">
                <TeamBadge short={match.homeShort} logo={match.homeLogo} align="left" />

                <div className="flex min-w-0 flex-1 flex-col items-center px-2 text-center">
                    <span
                        className="text-[9px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: "rgba(255, 255, 255, 0.58)" }}
                    >
                        Final Score
                    </span>
                    <span className="mt-1 text-2xl font-black text-white md:text-[2rem]">
                        {match.actualHomeScore ?? "-"} - {match.actualAwayScore ?? "-"}
                    </span>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/90">
                            {managerLabel}: {predictionLabel}
                        </span>
                        <span
                            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={pointsTone}
                        >
                            +{match.pointsEarned} pts
                        </span>
                    </div>
                </div>

                <TeamBadge short={match.awayShort} logo={match.awayLogo} align="right" />
            </div>

            <div
                className="border-t border-white/[0.06] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] md:px-5"
                style={{ color: "rgba(255, 255, 255, 0.52)" }}
            >
                {kickoffLabel}
            </div>
        </div>
    );
}
