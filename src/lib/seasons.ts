import { SEASONS, type Season, type Warmth } from "~/types/items";

// Maps a warmth rating (0=bare … 4=parka) to the seasons the piece naturally
// fits — without layering. Used as a smart default when a user hasn't manually
// set seasons. The mapping intentionally narrows: a warmth-2 garment doesn't
// belong in winter, even if you could layer it under a coat.
export const seasonsForWarmth = (warmth: Warmth): Season[] => {
  if (warmth === 0) return ["summer"];
  if (warmth === 1) return ["spring", "summer"];
  if (warmth === 2) return ["spring", "summer", "autumn"];
  if (warmth === 3) return ["autumn", "winter"];
  return ["winter"];
};

// Meteorological seasons (whole months) rather than astronomical ones: they
// line up with how people actually swap clothes and keep the maths trivial.
const NORTHERN_SEASON_BY_MONTH: readonly Season[] = [
  "winter",
  "winter",
  "spring",
  "spring",
  "spring",
  "summer",
  "summer",
  "summer",
  "autumn",
  "autumn",
  "autumn",
  "winter",
];

const SOUTHERN_COUNTERPART: Record<Season, Season> = {
  spring: "autumn",
  summer: "winter",
  autumn: "spring",
  winter: "summer",
};

// Without a location we assume the northern hemisphere, where the large
// majority of users live — a wrong guess is visible and the swap screen lets
// the user correct the seasons by hand.
const isSouthernHemisphere = (latitude: number | null): boolean => {
  if (latitude === null) return false;
  return latitude < 0;
};

export const calendarSeasonFor = (date: Date, latitude: number | null): Season => {
  const northernSeason = NORTHERN_SEASON_BY_MONTH[date.getMonth()];
  if (isSouthernHemisphere(latitude)) return SOUTHERN_COUNTERPART[northernSeason];
  return northernSeason;
};

const firstOfNextMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
};

// Thresholds sit a little outside the outfit scorer's comfort bands so a
// single mild day doesn't flip the whole wardrobe.
const SUMMER_FEEL_MIN_C = 20;
const WINTER_FEEL_MAX_C = 8;

export const seasonFeltAt = (tempC: number): Season | null => {
  if (tempC >= SUMMER_FEEL_MIN_C) return "summer";
  if (tempC < WINTER_FEEL_MAX_C) return "winter";
  return null;
};

export type ActiveSeasonsInput = {
  date: Date;
  latitude: number | null;
  tempC: number | null;
};

// The seasons whose clothes should be out in the closet right now: the
// calendar season, the one next month brings (so the coat is out before the
// first frost, not after), and whatever today's temperature actually feels
// like — weather rarely respects the calendar.
export const activeSeasonsFor = (input: ActiveSeasonsInput): Season[] => {
  const active = new Set<Season>();
  active.add(calendarSeasonFor(input.date, input.latitude));
  active.add(calendarSeasonFor(firstOfNextMonth(input.date), input.latitude));
  const felt = feltSeasonOrNull(input.tempC);
  if (felt !== null) active.add(felt);
  return SEASONS.filter((season) => active.has(season));
};

const feltSeasonOrNull = (tempC: number | null): Season | null => {
  if (tempC === null) return null;
  return seasonFeltAt(tempC);
};

// Identifies one occurrence of a calendar season, e.g. "winter-2026" for
// Dec 2026 – Feb 2027. January and February belong to the season that
// started the previous December, in both hemispheres.
export const seasonKeyFor = (date: Date, latitude: number | null): string => {
  const season = calendarSeasonFor(date, latitude);
  return `${season}-${seasonStartYear(date)}`;
};

const seasonStartYear = (date: Date): number => {
  const isJanuaryOrFebruary = date.getMonth() <= 1;
  if (isJanuaryOrFebruary) return date.getFullYear() - 1;
  return date.getFullYear();
};

export const warmthLabel = (warmth: Warmth): string => {
  if (warmth === 0) return "bare";
  if (warmth === 1) return "light";
  if (warmth === 2) return "regular";
  if (warmth === 3) return "warm";
  return "parka";
};
