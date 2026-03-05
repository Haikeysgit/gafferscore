import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    // ── Auth Guard (timing-safe) ──
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || "";
    const secret = process.env.SYNC_SECRET || "";

    if (!secret || !key || key.length !== secret.length
        || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(secret))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    try {
        // ── 1. Find the active gameweek where reminder_sent is false ──
        const { data: gameweeks, error: gwError } = await supabaseAdmin
            .from("gameweeks")
            .select("id, name, reminder_sent")
            .eq("reminder_sent", false)
            .order("id", { ascending: true });

        if (gwError) throw gwError;
        if (!gameweeks || gameweeks.length === 0) {
            return NextResponse.json({ message: "No gameweeks pending reminders." });
        }

        // ── 2. For each candidate gameweek, check if today is the first match day ──
        const today = new Date();
        const todayUTC = today.toISOString().slice(0, 10); // YYYY-MM-DD

        let targetGameweek = null;

        for (const gw of gameweeks) {
            // Get the earliest fixture in this gameweek
            const { data: firstFixture } = await supabaseAdmin
                .from("fixtures")
                .select("kickoff_time")
                .eq("gameweek_id", gw.id)
                .order("kickoff_time", { ascending: true })
                .limit(1)
                .single();

            if (!firstFixture) continue;

            const firstMatchDate = firstFixture.kickoff_time.slice(0, 10);

            if (firstMatchDate === todayUTC) {
                targetGameweek = gw;
                break;
            }
        }

        if (!targetGameweek) {
            return NextResponse.json({
                message: "Today is not the first match day of any pending gameweek. No emails sent.",
            });
        }

        // ── 3. Fetch all user emails from auth.users ──
        const allEmails: string[] = [];
        let page = 1;
        const perPage = 1000;

        while (true) {
            const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage,
            });

            if (usersError) throw usersError;
            if (!users || users.length === 0) break;

            for (const user of users) {
                if (user.email) allEmails.push(user.email);
            }

            if (users.length < perPage) break;
            page++;
        }

        if (allEmails.length === 0) {
            return NextResponse.json({ message: "No users found." });
        }

        // ── 4. Send emails via Resend Batch API (max 100 per batch) ──
        const emailHtml = `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #0a192f; border-radius: 16px;">
                    <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; text-align: center;">
                        🚨 Predictions Are Closing!
                    </h1>
                    <p style="color: #ffffffb3; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                        The next Premier League gameweek kicks off today. Don't leave points on the table and let your rivals climb the leaderboard. Lock in your exact score predictions before the first whistle blows.
                    </p>
                    <div style="text-align: center;">
                        <a href="https://gafferscore.xyz" style="display: inline-block; background-color: #00f5a0; color: #0a192f; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.5px;">
                            👉 Predict Now on GafferScore
                        </a>
                    </div>
                    <p style="color: #ffffff40; font-size: 11px; text-align: center; margin-top: 24px;">
                        You're receiving this because you have a GafferScore account.
                    </p>
                </div>
            `;

        const BATCH_SIZE = 100;
        for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
            const batch = allEmails.slice(i, i + BATCH_SIZE).map((email) => ({
                from: "GafferScore <onboarding@resend.dev>",
                to: [email],
                subject: "🚨 Gameweek predictions are closing soon!",
                html: emailHtml,
            }));

            const { error: batchError } = await resend.batch.send(batch);
            if (batchError) throw batchError;
        }

        // ── 5. Set reminder_sent = true (THE LOCK) ──
        const { error: updateError } = await supabaseAdmin
            .from("gameweeks")
            .update({ reminder_sent: true })
            .eq("id", targetGameweek.id);

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            gameweek: targetGameweek.name,
            emailsSent: allEmails.length,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[reminders] Error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
