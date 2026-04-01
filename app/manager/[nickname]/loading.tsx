import Footer from "@/app/components/Footer";
import SimpleBackHeader from "@/app/components/SimpleBackHeader";

function SkeletonBlock({
    className = "",
}: {
    className?: string;
}) {
    return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

export default function LoadingManagerProfile() {
    return (
        <>
            <SimpleBackHeader
                backHref="/leaderboard"
                backLabel="Back to Leaderboard"
                eyebrow="Manager Profile"
                title="Loading..."
            />

            <div className="flex min-h-screen flex-col bg-navy">
                <div
                    className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[520px] bg-contain bg-top bg-no-repeat opacity-55"
                    style={{
                        backgroundImage: "url('/4 players header.png')",
                        backgroundPosition: "center 82px",
                        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, transparent 100%)",
                    }}
                    aria-hidden="true"
                />

                <main className="relative z-10 flex-1">
                    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-3 py-4 md:px-6 md:py-7">
                        <section className="glass-card overflow-hidden rounded-[30px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
                            <div className="border-b border-white/[0.07] bg-white/[0.03] px-4 py-4 md:px-6">
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="flex h-[4.75rem] w-[4.75rem] shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.05] md:h-22 md:w-22">
                                        <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <SkeletonBlock className="h-3 w-20" />
                                        <SkeletonBlock className="mt-3 h-10 w-52 max-w-full" />
                                        <SkeletonBlock className="mt-4 h-4 w-full max-w-[30rem]" />
                                        <SkeletonBlock className="mt-2 h-4 w-3/4 max-w-[22rem]" />
                                    </div>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                                    alignItems: "stretch",
                                }}
                            >
                                {Array.from({ length: 3 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-4 md:px-4"
                                        style={{
                                            borderRight: index < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                            minHeight: "120px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            textAlign: "center",
                                        }}
                                    >
                                        <SkeletonBlock className="h-3 w-16" />
                                        <SkeletonBlock className="mt-4 h-10 w-20" />
                                        {index === 2 && <SkeletonBlock className="mt-3 h-3 w-24" />}
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] px-4 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.14)] md:px-6 md:py-6">
                            <div className="mb-5 flex items-end justify-between gap-3">
                                <div>
                                    <SkeletonBlock className="h-3 w-24" />
                                    <SkeletonBlock className="mt-3 h-10 w-56 max-w-full" />
                                </div>
                                <SkeletonBlock className="h-4 w-32" />
                            </div>

                            <div className="flex flex-col gap-5">
                                {Array.from({ length: 3 }).map((_, groupIndex) => (
                                    <section key={groupIndex} className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
                                            <div>
                                                <SkeletonBlock className="h-3 w-24" />
                                                <SkeletonBlock className="mt-3 h-4 w-36" />
                                            </div>
                                            <SkeletonBlock className="h-10 w-28" />
                                        </div>

                                        <div className="glass-card rounded-[24px] border border-white/10 px-3 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:px-5 md:py-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex w-16 shrink-0 flex-col items-center gap-2">
                                                    <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
                                                    <SkeletonBlock className="h-3 w-8" />
                                                </div>

                                                <div className="flex min-w-0 flex-1 flex-col items-center px-2">
                                                    <SkeletonBlock className="h-3 w-20" />
                                                    <SkeletonBlock className="mt-3 h-10 w-24" />
                                                    <div className="mt-4 flex items-center gap-2">
                                                        <SkeletonBlock className="h-7 w-28" />
                                                        <SkeletonBlock className="h-7 w-16" />
                                                    </div>
                                                </div>

                                                <div className="flex w-16 shrink-0 flex-col items-center gap-2">
                                                    <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
                                                    <SkeletonBlock className="h-3 w-8" />
                                                </div>
                                            </div>
                                            <div className="mt-4 border-t border-white/[0.06] pt-3">
                                                <SkeletonBlock className="mx-auto h-3 w-16" />
                                            </div>
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>

                <div className="relative z-10">
                    <Footer />
                </div>
            </div>
        </>
    );
}
