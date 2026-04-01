import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions";
import { getCurrentClubs } from "@/lib/clubs";
import SettingsClient from "@/app/components/SettingsClient";
import { measureServerTask } from "@/lib/performance";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    const supabase = await createClient();
    const [profileResult, clubs] = await measureServerTask("settings:initialData", () =>
        Promise.all([
            supabase
                .from("users")
                .select("nickname, favorite_club")
                .eq("id", user.id)
                .single(),
            getCurrentClubs(),
        ])
    );
    const profile = profileResult.data;

    return (
        <SettingsClient
            clubs={clubs}
            initialNickname={profile?.nickname ?? user.nickname}
            initialFavoriteClub={profile?.favorite_club ?? null}
        />
    );
}
