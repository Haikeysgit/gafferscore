/**
 * Football-data.org API v4 client with rate limiting.
 * Free tier: 10 requests/minute for Premier League.
 */

const BASE_URL = "https://api.football-data.org/v4";
const PL_CODE = "PL"; // Premier League competition code

// ── 14-Day Prediction Window (milliseconds) ──
export const PREDICTION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export const PREDICTION_WINDOW_DAYS = 14;

// ── Rate Limiter ──
// Simple token bucket: max 9 requests per 60 seconds (leaving 1 buffer)
let requestTimestamps: number[] = [];
const MAX_REQUESTS = 9;
const WINDOW_MS = 60_000;

async function rateLimitedFetch(url: string): Promise<Response> {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error("Missing FOOTBALL_DATA_API_KEY");

    // Clean old timestamps
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter((t) => now - t < WINDOW_MS);

    // If at limit, wait until the oldest request expires
    if (requestTimestamps.length >= MAX_REQUESTS) {
        const waitMs = WINDOW_MS - (now - requestTimestamps[0]) + 100;
        console.log(`[football-api] Rate limit reached, waiting ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        requestTimestamps = requestTimestamps.filter((t) => Date.now() - t < WINDOW_MS);
    }

    requestTimestamps.push(Date.now());

    const res = await fetch(url, {
        headers: { "X-Auth-Token": apiKey },
        cache: "no-store",
    });

    if (res.status === 429) {
        // API rate limit hit — wait 60s and retry once
        console.log("[football-api] 429 received, backing off 60s...");
        await new Promise((resolve) => setTimeout(resolve, 60_000));
        requestTimestamps = [];
        return rateLimitedFetch(url);
    }

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`football-data.org ${res.status}: ${body}`);
    }

    return res;
}


// ── Premier League Team Short Codes ──
const TEAM_SHORT_CODES: Record<string, string> = {
    "Arsenal FC": "ARS",
    "Aston Villa FC": "AVL",
    "AFC Bournemouth": "BOU",
    "Brentford FC": "BRE",
    "Brighton & Hove Albion FC": "BHA",
    "Chelsea FC": "CHE",
    "Crystal Palace FC": "CRY",
    "Everton FC": "EVE",
    "Fulham FC": "FUL",
    "Ipswich Town FC": "IPS",
    "Leicester City FC": "LEI",
    "Liverpool FC": "LIV",
    "Manchester City FC": "MCI",
    "Manchester United FC": "MUN",
    "Newcastle United FC": "NEW",
    "Nottingham Forest FC": "NFO",
    "Southampton FC": "SOU",
    "Tottenham Hotspur FC": "TOT",
    "West Ham United FC": "WHU",
    "Wolverhampton Wanderers FC": "WOL",
};

function getShortCode(teamName: string): string {
    return TEAM_SHORT_CODES[teamName] || teamName.substring(0, 3).toUpperCase();
}

function cleanTeamName(name: string): string {
    return name
        .replace(/ FC$/, "")
        .replace(/^AFC /, "")
        .replace(/ & Hove Albion$/, "");
}


// ── Status Mapping ──
function mapStatus(apiStatus: string): "pending" | "live" | "finished" {
    switch (apiStatus) {
        case "IN_PLAY":
        case "PAUSED":
        case "HALFTIME":
        case "EXTRA_TIME":
        case "PENALTY_SHOOTOUT":
            return "live";
        case "FINISHED":
        case "AWARDED":
            return "finished";
        case "SCHEDULED":
        case "TIMED":
        case "POSTPONED":
        case "CANCELLED":
        case "SUSPENDED":
        default:
            return "pending";
    }
}


// ── Types ──
export interface APIMatch {
    id: number;
    matchday: number;
    utcDate: string;
    status: string;
    homeTeam: { name: string; shortName: string; crest: string };
    awayTeam: { name: string; shortName: string; crest: string };
    score: {
        fullTime: { home: number | null; away: number | null };
    };
}

export interface ParsedFixture {
    api_match_id: number;
    matchday: number;
    home_team: string;
    away_team: string;
    home_short: string;
    away_short: string;
    home_logo: string;
    away_logo: string;
    kickoff_time: string;
    status: "pending" | "live" | "finished";
    home_score: number | null;
    away_score: number | null;
}

export interface SeasonInfo {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
}


// ── API Methods ──

/**
 * Fetch the authoritative current matchday from the Competition endpoint.
 * This is the API anchor — it returns the official league matchday,
 * unaffected by rescheduled matches.
 */
export async function fetchCurrentMatchday(): Promise<number> {
    const res = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}`
    );
    const data = await res.json();
    const matchday = data.currentSeason?.currentMatchday;
    if (!matchday) throw new Error("Could not determine currentMatchday from Competition endpoint");
    console.log(`[football-api] Competition endpoint reports currentMatchday: ${matchday}`);
    return matchday;
}

/**
 * Fetch all matches for the current PL season.
 * Returns parsed fixtures. The currentMatchday should be fetched
 * separately via fetchCurrentMatchday() (API anchor).
 */
export async function fetchAllMatches(): Promise<ParsedFixture[]> {
    const res = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}/matches`
    );
    const data = await res.json();

    return (data.matches || []).map((m: APIMatch) => ({
        api_match_id: m.id,
        matchday: m.matchday,
        home_team: cleanTeamName(m.homeTeam.name),
        away_team: cleanTeamName(m.awayTeam.name),
        home_short: getShortCode(m.homeTeam.name),
        away_short: getShortCode(m.awayTeam.name),
        home_logo: m.homeTeam.crest || "",
        away_logo: m.awayTeam.crest || "",
        kickoff_time: m.utcDate,
        status: mapStatus(m.status),
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
    }));
}

/**
 * Fetch matches for a specific matchday range (for live score updates).
 */
export async function fetchMatchdayMatches(matchday: number): Promise<ParsedFixture[]> {
    const res = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}/matches?matchday=${matchday}`
    );
    const data = await res.json();

    return (data.matches || []).map((m: APIMatch) => ({
        api_match_id: m.id,
        matchday: m.matchday,
        home_team: cleanTeamName(m.homeTeam.name),
        away_team: cleanTeamName(m.awayTeam.name),
        home_short: getShortCode(m.homeTeam.name),
        away_short: getShortCode(m.awayTeam.name),
        home_logo: m.homeTeam.crest || "",
        away_logo: m.awayTeam.crest || "",
        kickoff_time: m.utcDate,
        status: mapStatus(m.status),
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
    }));
}

/**
 * Fetch only live + recently finished matches (for the scores-only endpoint).
 */
export async function fetchLiveAndRecentMatches(): Promise<ParsedFixture[]> {
    // Fetch matches from today and yesterday to catch recently finished
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateFrom = yesterday.toISOString().split("T")[0];
    const dateTo = today.toISOString().split("T")[0];

    const res = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
    );
    const data = await res.json();

    return (data.matches || []).map((m: APIMatch) => ({
        api_match_id: m.id,
        matchday: m.matchday,
        home_team: cleanTeamName(m.homeTeam.name),
        away_team: cleanTeamName(m.awayTeam.name),
        home_short: getShortCode(m.homeTeam.name),
        away_short: getShortCode(m.awayTeam.name),
        home_logo: m.homeTeam.crest || "",
        away_logo: m.awayTeam.crest || "",
        kickoff_time: m.utcDate,
        status: mapStatus(m.status),
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
    }));
}
