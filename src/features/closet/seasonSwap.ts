import type { Item, Season } from "~/types/items";
import { isStored } from "~/lib/itemAvailability";

export type SeasonSwapPlan = {
  packAway: Item[];
  bringOut: Item[];
};

// Untagged items are left exactly where they are: "no seasons" means the
// user hasn't decided, and silently boxing up their favourite jacket would
// be worse than leaving one stray piece out.
export const planSeasonSwap = (
  items: Item[],
  activeSeasons: readonly Season[],
): SeasonSwapPlan => {
  const tagged = items.filter(hasSeasonTags);
  const packAway = tagged.filter((item) => {
    if (isStored(item)) return false;
    return !fitsAnySeason(item, activeSeasons);
  });
  const bringOut = tagged.filter((item) => {
    if (!isStored(item)) return false;
    return fitsAnySeason(item, activeSeasons);
  });
  return { packAway, bringOut };
};

const hasSeasonTags = (item: Item): boolean => {
  return item.seasons.length > 0;
};

const fitsAnySeason = (item: Item, seasons: readonly Season[]): boolean => {
  return item.seasons.some((season) => seasons.includes(season));
};

export const swapMoveCount = (plan: SeasonSwapPlan): number => {
  return plan.packAway.length + plan.bringOut.length;
};

export type SeasonSwapSelection = {
  storeItemIds: string[];
  returnItemIds: string[];
};

// The screen pre-selects every suggested move; the user un-ticks the ones
// to leave alone (e.g. shorts kept out for the gym).
export const selectedMoves = (
  plan: SeasonSwapPlan,
  skippedIds: ReadonlySet<string>,
): SeasonSwapSelection => {
  const isChosen = (item: Item) => !skippedIds.has(item.id);
  return {
    storeItemIds: plan.packAway.filter(isChosen).map((item) => item.id),
    returnItemIds: plan.bringOut.filter(isChosen).map((item) => item.id),
  };
};

export const selectionSize = (selection: SeasonSwapSelection): number => {
  return selection.storeItemIds.length + selection.returnItemIds.length;
};

// A piece that has been in the closet for a full season and was never worn
// is a declutter candidate. Only meaningful once the user actually logs
// wears — otherwise every item would look "unworn".
const UNWORN_AFTER_DAYS = 90;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const unwornItemIds = (
  items: Item[],
  wearCounts: ReadonlyMap<string, number> | undefined,
  now: Date,
): Set<string> => {
  const unworn = new Set<string>();
  if (!wearCounts) return unworn;
  if (wearCounts.size === 0) return unworn;
  for (const item of items) {
    if (wearCounts.has(item.id)) continue;
    if (!ownedLongEnough(item, now)) continue;
    unworn.add(item.id);
  }
  return unworn;
};

const ownedLongEnough = (item: Item, now: Date): boolean => {
  const addedAt = new Date(item.created_at).getTime();
  const ageInDays = (now.getTime() - addedAt) / MILLISECONDS_PER_DAY;
  return ageInDays >= UNWORN_AFTER_DAYS;
};
