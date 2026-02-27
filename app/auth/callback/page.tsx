"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
    const router = useRouter();
    const supabase = createClient();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuthCallback = async () => {
            // First, let the Supabase client parse the URL hash securely
            // This happens automatically in the browser client when it initializes.
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error("Session error:", sessionError);
                setError(sessionError.message);

                // Allow user to read error before redirecting to login
                setTimeout(() => router.push("/auth?error=invalid_auth_code"), 3000);
                return;
            }

            // If we have a session, figure out where to send them
            if (session) {
                // Check if they are mid-recovery flow (from hash or query)
                const hash = window.location.hash;
                const searchParams = new URLSearchParams(window.location.search);

                const isRecovery = hash.includes("type=recovery") || searchParams.get("type") === "recovery";

                if (isRecovery) {
                    router.push("/update-password");
                } else {
                    // Normal login/signup fallback
                    const next = searchParams.get("next") || "/dashboard";
                    router.push(next);
                }
            } else {
                // If there's no session and no hash, they shouldn't be here
                // We'll let the user see the "verifying" state briefly before redirect
                setTimeout(() => router.push("/auth?error=invalid_auth_code"), 1500);
            }
        };

        handleAuthCallback();
    }, [router, supabase]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-navy px-4">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-mint"></div>

                {!error ? (
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white">Verifying Authentication</h2>
                        <p className="text-sm font-light text-white/50">
                            Please wait while we securely load your session...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-red-500">Verification Failed</h2>
                        <p className="text-sm font-light text-white/50">{error}</p>
                        <p className="text-xs text-white/30">Redirecting to login...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
