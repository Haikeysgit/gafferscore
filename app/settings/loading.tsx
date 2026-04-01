import Footer from "@/app/components/Footer";
import SimpleBackHeader from "@/app/components/SimpleBackHeader";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-full bg-white/10 ${className}`} />;
}

export default function SettingsLoading() {
    return (
        <div className="flex min-h-screen flex-col bg-navy">
            <SimpleBackHeader
                backHref="/dashboard"
                backLabel="Back to Dashboard"
                title="Settings"
            />

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
                <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
                    <div className="mb-8">
                        <Skeleton className="h-10 w-40" />
                        <Skeleton className="mt-3 h-4 w-52" />
                    </div>

                    <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="mt-6 h-4 w-24" />
                        <Skeleton className="mt-2 h-12 w-full rounded-lg" />
                        <Skeleton className="mt-6 h-4 w-24" />
                        <Skeleton className="mt-2 h-12 w-full rounded-lg" />
                        <Skeleton className="mt-6 h-12 w-full rounded-lg" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <Skeleton className="h-3 w-18" />
                        <Skeleton className="mt-6 h-4 w-28" />
                        <Skeleton className="mt-2 h-12 w-full rounded-lg" />
                        <Skeleton className="mt-6 h-12 w-full rounded-lg" />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
