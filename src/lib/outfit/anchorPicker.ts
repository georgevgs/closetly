import type { Item, Category } from "../../types/items";
import { recencyPenaltyForDaysAgo } from "../../features/outfits/tuning";
import type { WeatherContext } from "./score";

// A "today" outfit is best anchored on the piece that defines the silhouette.
// Bottoms and dresses do that more strongly than tops or shoes.
const PRIMARY_ANCHOR_CATEGORIES: Category[] = ["bottom", "dress"];
const FALLBACK_ANCHOR_CATEGORIES: Category[] = ["top"];

export type AnchorPickerOptions = {
  closet: Item[];
  weather?: WeatherContext;
  recentlyWornItemIds?: Map<string, number>;
  count?: number;
};

export const pickAnchorsForToday = (opts: AnchorPickerOptions): Item[] => {
  const { closet, weather, recentlyWornItemIds, count = 3 } = opts;

  const candidates = filterAnchorCandidates(closet);
  if (candidates.length === 0) return [];

  const ranked = candidates
    .map((item) => ({
      item,
      score: anchorScore(item, weather, recentlyWornItemIds),
    }))
    .sort((first, second) => second.score - first.score);

  return ranked.slice(0, count).map((entry) => entry.item);
};

const filterAnchorCandidates = (closet: Item[]): Item[] => {
  const primary = closet.filter((item) => PRIMARY_ANCHOR_CATEGORIES.includes(item.category));
  if (primary.length > 0) return primary;
  return closet.filter((item) => FALLBACK_ANCHOR_CATEGORIES.includes(item.category));
};

const anchorScore = (
  item: Item,
  weather: WeatherContext | undefined,
  recentlyWornItemIds: Map<string, number> | undefined,
): number => {
  let score = 50;
  score += seasonBonus(item, weather);
  score -= recencyPenalty(item, recentlyWornItemIds);
  return score;
};

const seasonBonus = (item: Item, weather: WeatherContext | undefined): number => {
  if (!weather) return 0;
  // Empty seasons = "user hasn't decided" — neutral, not a penalty.
  if (item.seasons.length === 0) return 0;

  const tempC = weather.tempC;
  if (tempC >= 18) return warmWeatherBonus(item.seasons);
  if (tempC >= 10) return mildWeatherBonus(item.seasons);
  return coldWeatherBonus(item.seasons);
};

// All-season pieces (4 tags) get the base match bonus; specifically-tagged
// pieces get a specificity multiplier so a summer-only item is preferred over
// a year-round one on a hot day.
const SPECIFICITY_BONUS = 5;

const specificityMultiplier = (seasonCount: number): number => {
  if (seasonCount <= 0) return 0;
  if (seasonCount >= 4) return 0;
  return (4 - seasonCount) / 3;
};

const warmWeatherBonus = (seasons: Item["seasons"]): number => {
  const multiplier = specificityMultiplier(seasons.length);
  if (seasons.includes("summer")) return 12 + SPECIFICITY_BONUS * multiplier;
  if (seasons.includes("spring")) return 8 + SPECIFICITY_BONUS * multiplier;
  return -5;
};

const mildWeatherBonus = (seasons: Item["seasons"]): number => {
  const multiplier = specificityMultiplier(seasons.length);
  if (seasons.includes("spring")) return 10 + SPECIFICITY_BONUS * multiplier;
  if (seasons.includes("autumn")) return 10 + SPECIFICITY_BONUS * multiplier;
  return 0;
};

const coldWeatherBonus = (seasons: Item["seasons"]): number => {
  const multiplier = specificityMultiplier(seasons.length);
  if (seasons.includes("winter")) return 12 + SPECIFICITY_BONUS * multiplier;
  if (seasons.includes("autumn")) return 8 + SPECIFICITY_BONUS * multiplier;
  return -5;
};

const recencyPenalty = (
  item: Item,
  recentlyWornItemIds: Map<string, number> | undefined,
): number => {
  if (!recentlyWornItemIds) return 0;
  const daysAgo = recentlyWornItemIds.get(item.id);
  if (daysAgo === undefined) return 0;
  return recencyPenaltyForDaysAgo(daysAgo);
};
