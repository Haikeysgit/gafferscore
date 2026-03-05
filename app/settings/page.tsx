import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions";
import { getCurrentClubs } from "@/lib/clubs";
import SettingsClient from "@/app/components/SettingsClient";

export default async function SettingsPage() {
    const user = await getCurrentUser();
    if (!user || !user.nickname) redirect("/");

    // Fetch current EPL clubs (cached for 7 days)
    const clubs = await getCurrentClubs();

    return <SettingsClient clubs={clubs} nickname={user.nickname} />;
}
