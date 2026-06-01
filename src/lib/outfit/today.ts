import type { Item, Occasion, Style } from "../../types/items";
import { suggestOutfits, type OutfitSuggestion } from "./combinator";
import { pickAnchorsForToday } from "./anchorPicker";
import { pickDiverseOutfits } from "./diversity";
import { createSeededRandom, dailySeed } from "./seededRandom";
import type { WeatherContext } from "./score";

export type TodayOutfitOptions = {
  closet: Item[];
  weather?: WeatherContext;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
  preferredStyles?: ReadonlySet<Style>;
  itemWearCounts?: Map<string, number>;
  targetOccasion?: Occasion;
  count?: number;
  // Injectable for tests — production callers should leave this undefined so
  // the seed comes from the actual current date.
  now?: Date;
};

// Oversample then re-rank: pull more anchors and more outfits per anchor than
// we'll display so the diversity picker has variety to avoid "same top with
// three different shoes." Standard recommender-system pattern.
const ANCHOR_POOL_MULTIPLIER = 2;
const PER_ANCHOR_LIMIT = 4;

export const suggestTodayOutfits = (opts: TodayOutfitOptions): OutfitSuggestion[] => {
  const {
    closet,
    weather,
    pairAffinity,
    recentlyWornItemIds,
    preferredStyles,
    itemWearCounts,
    targetOccasion,
    count = 3,
    now,
  } = opts;

  const anchors = pickAnchorsForToday({
    closet,
    weather,
    recentlyWornItemIds,
    targetOccasion,
    count: count * ANCHOR_POOL_MULTIPLIER,
  });
  if (anchors.length === 0) return [];

  const pool: OutfitSuggestion[] = [];
  for (const anchor of anchors) {
    const fromAnchor = suggestOutfits({
      anchor,
      closet,
      weather,
      pairAffinity,
      recentlyWornItemIds,
      preferredStyles,
      itemWearCounts,
      targetOccasion,
      limit: PER_ANCHOR_LIMIT,
    });
    pool.push(...fromAnchor);
  }

  const deduped = dedupeBySignature(pool);
  const random = createSeededRandom(dailySeed(now));
  return pickDiverseOutfits({ candidates: deduped, count, random });
};

const dedupeBySignature = (suggestions: OutfitSuggestion[]): OutfitSuggestion[] => {
  const seen = new Set<string>();
  const unique: OutfitSuggestion[] = [];
  for (const suggestion of suggestions) {
    const signature = signatureOf(suggestion);
    if (seen.has(signature)) continue;
    seen.add(signature);
    unique.push(suggestion);
  }
  return unique;
};

const signatureOf = (suggestion: OutfitSuggestion): string => {
  return suggestion.items
    .map((item) => item.id)
    .sort()
    .join("|");
};
