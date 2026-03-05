// Dynamic Premier League club data from football-data.org
// Cached aggressively (7 days) since teams only change once a year

export interface Club {
    name: string;
    short: string;
    crestUrl: string;
}

// Static fallback in case the API is down
const FALLBACK_CLUBS: Club[] = [
    { name: "Arsenal", short: "ARS", crestUrl: "https://crests.football-data.org/57.png" },
    { name: "Aston Villa", short: "AVL", crestUrl: "https://crests.football-data.org/58.png" },
    { name: "Bournemouth", short: "BOU", crestUrl: "https://crests.football-data.org/1044.png" },
    { name: "Brentford", short: "BRE", crestUrl: "https://crests.football-data.org/402.png" },
    { name: "Brighton", short: "BHA", crestUrl: "https://crests.football-data.org/397.png" },
    { name: "Chelsea", short: "CHE", crestUrl: "https://crests.football-data.org/61.png" },
    { name: "Crystal Palace", short: "CRY", crestUrl: "https://crests.football-data.org/354.png" },
    { name: "Everton", short: "EVE", crestUrl: "https://crests.football-data.org/62.png" },
    { name: "Fulham", short: "FUL", crestUrl: "https://crests.football-data.org/63.png" },
    { name: "Ipswich Town", short: "IPS", crestUrl: "https://crests.football-data.org/349.png" },
    { name: "Leicester City", short: "LEI", crestUrl: "https://crests.football-data.org/338.png" },
    { name: "Liverpool", short: "LIV", crestUrl: "https://crests.football-data.org/64.png" },
    { name: "Man City", short: "MCI", crestUrl: "https://crests.football-data.org/65.png" },
    { name: "Man United", short: "MUN", crestUrl: "https://crests.football-data.org/66.png" },
    { name: "Newcastle", short: "NEW", crestUrl: "https://crests.football-data.org/67.png" },
    { name: "Nottm Forest", short: "NFO", crestUrl: "https://crests.football-data.org/351.png" },
    { name: "Southampton", short: "SOU", crestUrl: "https://crests.football-data.org/340.png" },
    { name: "Tottenham", short: "TOT", crestUrl: "https://crests.football-data.org/73.png" },
    { name: "West Ham", short: "WHU", crestUrl: "https://crests.football-data.org/563.png" },
    { name: "Wolves", short: "WOL", crestUrl: "https://crests.football-data.org/76.png" },
];

/**
 * Fetch the current PL teams from football-data.org.
 * Cached for 7 days (604800s) since teams only change once a year.
 * Falls back to the static array if the API is unreachable.
 */
export async function getCurrentClubs(): Promise<Club[]> {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
        console.warn("[clubs] No FOOTBALL_DATA_API_KEY — using static fallback");
        return FALLBACK_CLUBS;
    }

    try {
        const res = await fetch("https://api.football-data.org/v4/competitions/PL/teams", {
            headers: { "X-Auth-Token": apiKey },
            next: { revalidate: 604800 }, // Cache for 7 days
        });

        if (!res.ok) {
            console.error(`[clubs] API returned ${res.status} — using fallback`);
            return FALLBACK_CLUBS;
        }

        const data = await res.json();

        const clubs: Club[] = (data.teams || [])
            .map((team: { name: string; tla: string; crest: string }) => ({
                name: team.name
                    .replace(/ FC$/, "")
                    .replace(/^AFC /, "")
                    .replace(/ & Hove Albion$/, ""),
                short: team.tla,
                crestUrl: team.crest,
            }))
            .sort((a: Club, b: Club) => a.name.localeCompare(b.name));

        return clubs.length > 0 ? clubs : FALLBACK_CLUBS;
    } catch (err) {
        console.error("[clubs] Failed to fetch from API:", err);
        return FALLBACK_CLUBS;
    }
}

// Re-export fallback for any code that needs sync access
export const EPL_CLUBS = FALLBACK_CLUBS;
