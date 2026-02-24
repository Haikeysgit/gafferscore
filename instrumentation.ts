/**
 * Next.js Instrumentation — runs once on server startup.
 * Sets up a 3-minute interval to auto-sync live scores from football-data.org.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const syncSecret = process.env.SYNC_SECRET;
        if (!syncSecret) {
            console.warn("[auto-sync] SYNC_SECRET not set, skipping auto-sync");
            return;
        }

        // Delay first sync by 15s to let the server fully start
        setTimeout(() => {
            console.log("[auto-sync] Starting 3-minute score sync interval");

            // Run immediately on first tick
            triggerSync(syncSecret);

            // Then every 3 minutes
            setInterval(() => triggerSync(syncSecret), 3 * 60 * 1000);
        }, 15_000);
    }
}

async function triggerSync(secret: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const res = await fetch(`${baseUrl}/api/sync/scores?key=${secret}`, {
            cache: "no-store",
        });
        const data = await res.json();
        if (data.updated > 0) {
            console.log(`[auto-sync] Updated ${data.updated} fixture(s)`);
        }
    } catch (err) {
        console.error("[auto-sync] Sync failed:", err);
    }
}
