import type { Item, Occasion, Style } from "../../types/items";
import { suggestOutfits, type OutfitSuggestion } from "./combinator";
import { pickAnchorsForToday } from "./anchorPicker";
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
};

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
  } = opts;

  const anchors = pickAnchorsForToday({
    closet,
    weather,
    recentlyWornItemIds,
    targetOccasion,
    count,
  });
  if (anchors.length === 0) return [];

  const all: OutfitSuggestion[] = [];
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
      limit: 3,
    });
    all.push(...fromAnchor);
  }

  return dedupeBySignature(all)
    .sort((first, second) => second.score.total - first.score.total)
    .slice(0, count);
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
