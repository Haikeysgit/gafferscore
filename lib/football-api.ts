import { FIXTURE_STATUSES, type FixtureStatus } from "@/lib/fixture-status";

/**
 * Football-data.org API v4 client with rate limiting.
 * Free tier: 10 requests/minute for Premier League.
 */

const BASE_URL = "https://api.football-data.org/v4";
const PL_CODE = "PL";

export const PREDICTION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
export const PREDICTION_WINDOW_DAYS = 14;

let requestTimestamps: number[] = [];
const MAX_REQUESTS = 9;
const WINDOW_MS = 60_000;

async function rateLimitedFetch(url: string): Promise<Response> {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error("Missing FOOTBALL_DATA_API_KEY");

    const now = Date.now();
    requestTimestamps = requestTimestamps.filter((timestamp) => now - timestamp < WINDOW_MS);

    if (requestTimestamps.length >= MAX_REQUESTS) {
        const waitMs = WINDOW_MS - (now - requestTimestamps[0]) + 100;
        console.log(`[football-api] Rate limit reached, waiting ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        requestTimestamps = requestTimestamps.filter((timestamp) => Date.now() - timestamp < WINDOW_MS);
    }

    requestTimestamps.push(Date.now());

    const response = await fetch(url, {
        headers: { "X-Auth-Token": apiKey },
        cache: "no-store",
    });

    if (response.status === 429) {
        console.log("[football-api] 429 received, backing off 60s...");
        await new Promise((resolve) => setTimeout(resolve, 60_000));
        requestTimestamps = [];
        return rateLimitedFetch(url);
    }

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`football-data.org ${response.status}: ${body}`);
    }

    return response;
}

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

function mapStatus(apiStatus: string): FixtureStatus {
    if (FIXTURE_STATUSES.includes(apiStatus as FixtureStatus)) {
        return apiStatus as FixtureStatus;
    }

    console.warn(`[football-api] Unknown status "${apiStatus}" received. Falling back to SCHEDULED.`);
    return "SCHEDULED";
}

function formatApiDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

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
    status: FixtureStatus;
    home_score: number | null;
    away_score: number | null;
}

export interface SeasonInfo {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
}

function parseMatches(matches: APIMatch[] = []): ParsedFixture[] {
    return matches.map((match) => ({
        api_match_id: match.id,
        matchday: match.matchday,
        home_team: cleanTeamName(match.homeTeam.name),
        away_team: cleanTeamName(match.awayTeam.name),
        home_short: getShortCode(match.homeTeam.name),
        away_short: getShortCode(match.awayTeam.name),
        home_logo: match.homeTeam.crest || "",
        away_logo: match.awayTeam.crest || "",
        kickoff_time: match.utcDate,
        status: mapStatus(match.status),
        home_score: match.score.fullTime.home,
        away_score: match.score.fullTime.away,
    }));
}

export async function fetchCurrentMatchday(): Promise<number> {
    const response = await rateLimitedFetch(`${BASE_URL}/competitions/${PL_CODE}`);
    const data = await response.json();
    const matchday = data.currentSeason?.currentMatchday;

    if (!matchday) {
        throw new Error("Could not determine currentMatchday from Competition endpoint");
    }

    console.log(`[football-api] Competition endpoint reports currentMatchday: ${matchday}`);
    return matchday;
}

export async function fetchAllMatches(): Promise<ParsedFixture[]> {
    const response = await rateLimitedFetch(`${BASE_URL}/competitions/${PL_CODE}/matches`);
    const data = await response.json();
    return parseMatches(data.matches || []);
}

export async function fetchMatchdayMatches(matchday: number): Promise<ParsedFixture[]> {
    const response = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}/matches?matchday=${matchday}`,
    );
    const data = await response.json();
    return parseMatches(data.matches || []);
}

/**
 * Fetch fixtures in a rolling Yesterday/Today/Tomorrow window so fast syncs
 * catch late score corrections and next-day postponement updates.
 */
export async function fetchRollingWindowMatches(): Promise<ParsedFixture[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFrom = formatApiDate(yesterday);
    const dateTo = formatApiDate(tomorrow);

    const response = await rateLimitedFetch(
        `${BASE_URL}/competitions/${PL_CODE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    );
    const data = await response.json();

    return parseMatches(data.matches || []);
}

export async function fetchLiveAndRecentMatches(): Promise<ParsedFixture[]> {
    return fetchRollingWindowMatches();
}
