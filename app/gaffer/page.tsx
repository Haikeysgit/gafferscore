export const dynamic = 'force-dynamic';
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions";
import { measureServerTask } from "@/lib/performance";
import { createAdminClient } from "@/lib/supabase/admin";
import GafferClient from "./GafferClient";

export default async function GafferPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const supabase = createAdminClient();

    const [
        { data: fixtures },
        { data: predictions },
        { data: performance },
    ] = await measureServerTask("gaffer:initialData", () =>
        Promise.all([
            supabase
                .from("fixtures")
                .select("*")
                .order("kickoff_time", { ascending: true }),
            supabase
                .from("gaffer_predictions")
                .select("*")
                .order("kickoff_time", { ascending: true }),
            supabase
                .from("gaffer_performance")
                .select("*")
                .order("created_at", { ascending: false }),
        ])
    );

    const normalizeKey = (value: unknown) => {
        if (value === null || value === undefined) return null;
        return String(value);
    };
    const predictionMap = new Map(
        (predictions ?? []).map((prediction) => [normalizeKey(prediction.fixture_id), prediction]),
    );
    const performanceMap = new Map(
        (performance ?? []).map((entry) => [normalizeKey(entry.fixture_id), entry]),
    );
    const parseGameweek = (value: unknown) => {
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : null;
    };

    const combinedFixtures = (fixtures ?? []).map((fixture) => {
        const fixtureLookupKey = normalizeKey(
            fixture.api_match_id ?? fixture.fixture_id ?? fixture.id,
        );
        const prediction = fixtureLookupKey ? predictionMap.get(fixtureLookupKey) : undefined;
        const performanceEntry = fixtureLookupKey ? performanceMap.get(fixtureLookupKey) : undefined;
        const gameweek =
            parseGameweek(fixture.gameweek_id) ??
            parseGameweek(fixture.gameweek) ??
            parseGameweek(fixture.matchday) ??
            parseGameweek(prediction?.gameweek) ??
            parseGameweek(performanceEntry?.gameweek) ??
            null;

        return {
            ...fixture,
            prediction: prediction ?? null,
            ...(prediction ?? {}),
            fixture_id: fixtureLookupKey ?? "",
            performance: performanceEntry ?? null,
            gameweek,
            gameweek_id: parseGameweek(fixture.gameweek_id) ?? gameweek,
        };
    });

    return (
        <GafferClient
            user={user}
            fixtures={combinedFixtures}
            performance={performance ?? []}
        />
    );
}
