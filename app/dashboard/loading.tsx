import DashboardHeader from "@/app/components/DashboardHeader";
import Footer from "@/app/components/Footer";

function Skeleton({
    className = "",
}: {
    className?: string;
}) {
    return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

function MatchCardSkeleton({ index }: { index: number }) {
    return (
        <div
            className="glass-card w-full overflow-hidden rounded-xl border border-white/10"
            style={{ animationDelay: `${index * 70}ms` }}
        >
            <div className="flex items-center justify-center py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                <Skeleton className="h-3 w-16" />
            </div>

            <div className="flex items-center justify-between px-3 py-3 md:px-5 md:py-4">
                <div className="flex w-10 shrink-0 flex-col items-center gap-1 md:w-20">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/10 md:h-12 md:w-12" />
                    <Skeleton className="h-3 w-8 md:w-12" />
                </div>

                <div className="flex shrink-0 flex-col items-center gap-1">
                    <Skeleton className="h-5 w-5 rounded-full md:h-7 md:w-7" />
                    <Skeleton className="h-9 w-9 rounded-md md:h-12 md:w-12" />
                    <Skeleton className="h-5 w-5 rounded-full md:h-7 md:w-7" />
                </div>

                <div className="flex min-w-0 flex-col items-center gap-2 px-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-18" />
                </div>

                <div className="flex shrink-0 flex-col items-center gap-1">
                    <Skeleton className="h-5 w-5 rounded-full md:h-7 md:w-7" />
                    <Skeleton className="h-9 w-9 rounded-md md:h-12 md:w-12" />
                    <Skeleton className="h-5 w-5 rounded-full md:h-7 md:w-7" />
                </div>

                <div className="flex w-10 shrink-0 flex-col items-center gap-1 md:w-20">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/10 md:h-12 md:w-12" />
                    <Skeleton className="h-3 w-8 md:w-12" />
                </div>
            </div>

            <div className="border-t border-white/5 px-3 py-2.5 md:px-6 md:py-3">
                <Skeleton className="h-10 w-full rounded-full" />
            </div>
        </div>
    );
}

export default function DashboardLoading() {
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

            <DashboardHeader />

            <main className="relative z-10 flex-1">
                <div className="px-3 pb-4 pt-4 md:px-6">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex flex-col items-center gap-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 px-3 pb-12 md:mx-auto md:max-w-6xl md:grid-cols-2 md:gap-4 md:px-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <MatchCardSkeleton key={index} index={index} />
                    ))}
                </div>
            </main>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
