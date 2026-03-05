import LeaderboardSkeleton from "@/app/components/LeaderboardSkeleton";

export default function LeaderboardLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-navy">
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
            <main className="relative z-10 flex-1">
                <LeaderboardSkeleton />
            </main>
        </div>
    );
}
