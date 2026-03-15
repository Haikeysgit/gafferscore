export const FIXTURE_STATUSES = [
    "SCHEDULED",
    "TIMED",
    "IN_PLAY",
    "PAUSED",
    "HALFTIME",
    "EXTRA_TIME",
    "PENALTY_SHOOTOUT",
    "FINISHED",
    "AWARDED",
    "POSTPONED",
    "SUSPENDED",
    "CANCELLED",
] as const;

export type FixtureStatus = (typeof FIXTURE_STATUSES)[number];

export const LIVE_FIXTURE_STATUSES = [
    "IN_PLAY",
    "PAUSED",
    "HALFTIME",
    "EXTRA_TIME",
    "PENALTY_SHOOTOUT",
] as const;

export const FULL_TIME_FIXTURE_STATUSES = [
    "FINISHED",
    "AWARDED",
] as const;

export function isFixtureStatus(value: string): value is FixtureStatus {
    return FIXTURE_STATUSES.includes(value as FixtureStatus);
}

export function isFixtureLive(status: string): boolean {
    return LIVE_FIXTURE_STATUSES.includes(status as (typeof LIVE_FIXTURE_STATUSES)[number]);
}

export function isFixtureFullTime(status: string): boolean {
    return FULL_TIME_FIXTURE_STATUSES.includes(status as (typeof FULL_TIME_FIXTURE_STATUSES)[number]);
}

export function getFixtureStatusLabel(status: string): string {
    switch (status) {
        case "FINISHED":
        case "AWARDED":
            return "Full Time";
        case "IN_PLAY":
        case "PAUSED":
        case "HALFTIME":
        case "EXTRA_TIME":
        case "PENALTY_SHOOTOUT":
            return "Live";
        case "POSTPONED":
            return "Postponed";
        case "SUSPENDED":
            return "Suspended";
        case "CANCELLED":
            return "Cancelled";
        case "TIMED":
        case "SCHEDULED":
            return "Scheduled";
        default:
            return status.replace(/_/g, " ");
    }
}
