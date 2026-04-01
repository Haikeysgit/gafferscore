import DashboardHeader from "@/app/components/DashboardHeader";
import Footer from "@/app/components/Footer";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

export default function GafferLoading() {
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
                <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 md:px-6">
                    <div className="mb-8">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-4 h-12 w-56 max-w-full" />
                        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
                    </div>

                    <div className="mb-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                        <Skeleton className="h-4 w-40" />
                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-6">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="mt-6 h-12 w-20" />
                                    <Skeleton className="mt-6 h-3 w-28" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                                        <Skeleton className="h-3 w-14" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-8 w-24" />
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
                                        <Skeleton className="h-3 w-14" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <div className="relative z-10">
                <Footer />
            </div>
        </div>
    );
}
