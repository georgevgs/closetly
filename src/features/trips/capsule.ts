import type { Item, Category, Season } from "~/types/items";
import { paletteHarmony } from "~/lib/color/harmony";
import { scoreOutfit, type WeatherContext } from "~/lib/outfit/score";

export type CapsuleInput = {
  closet: Item[];
  days: number;
  tempMinC: number;
  tempMaxC: number;
  seasons: Season[];
  formality?: { min: number; max: number };
};

export type Capsule = {
  items: Item[];
  byCategory: Record<Category, Item[]>;
  itemCount: number;
};

const SLOT_PLAN = (days: number): Partial<Record<Category, number>> => ({
  top: Math.max(2, Math.min(7, Math.ceil(days / 2))),
  bottom: Math.max(1, Math.min(4, Math.ceil(days / 3))),
  outerwear: 1,
  shoes: days >= 4 ? 2 : 1,
  dress: days >= 4 ? 1 : 0,
  bag: 1,
  accessory: Math.min(3, Math.ceil(days / 3)),
  hat: 0,
});

// Categories the full outfit scorer reasons about. Bag / hat / accessory don't
// participate in scoreOutfit, so we keep the color-match heuristic for those.
const OUTFIT_CATEGORIES = new Set<Category>([
  "top",
  "bottom",
  "dress",
  "shoes",
  "outerwear",
]);

// Bound the enumeration: with 12 candidates per category, top×bottom×shoes is
// 1728, plus optional outer (12 more) brings worst case under ~25k outfits —
// well under the JS-thread budget for this synchronous compute.
const PER_CATEGORY_PREFILTER = 12;

// "High-scoring" cut-off when accumulating per-item value. Items only earn
// value from outfits at or above this threshold so the ranking favours pieces
// that participate in *good* combinations, not just *many* combinations.
const HIGH_SCORE_THRESHOLD = 70;

export function buildCapsule(input: CapsuleInput): Capsule {
  const { closet, days, tempMinC, tempMaxC, seasons, formality } = input;

  const targetWarmth = warmthForRange(tempMinC, tempMaxC);
  const candidates = closet.filter((item) =>
    isCapsuleCandidate(item, { seasons, formality, targetWarmth }),
  );
  const weather = weatherContextForRange(tempMinC, tempMaxC);

  const itemValue = computeItemValueByOutfits(candidates, weather);

  const plan = SLOT_PLAN(days);
  const byCategory = emptyByCategory();
  for (const [category, count] of Object.entries(plan) as [Category, number][]) {
    if (count <= 0) continue;
    const pool = candidates.filter((item) => item.category === category);
    if (OUTFIT_CATEGORIES.has(category)) {
      byCategory[category] = rankByOutfitParticipation(pool, itemValue, count, candidates);
      continue;
    }
    byCategory[category] = rankByColorMatch(pool, candidates, count);
  }

  const items = Object.values(byCategory).flat();
  return { items, byCategory, itemCount: items.length };
}

type CapsuleFilterContext = {
  seasons: Season[];
  formality: CapsuleInput["formality"];
  targetWarmth: number;
};

const isCapsuleCandidate = (item: Item, context: CapsuleFilterContext): boolean => {
  if (!matchesSeasons(item, context.seasons)) return false;
  if (!matchesFormality(item, context.formality)) return false;
  if (!matchesWarmth(item.warmth, context.targetWarmth)) return false;
  return true;
};

const matchesSeasons = (item: Item, seasons: Season[]): boolean => {
  if (item.seasons.length === 0) return true;
  return item.seasons.some((season) => seasons.includes(season));
};

const matchesFormality = (
  item: Item,
  formality: CapsuleInput["formality"],
): boolean => {
  if (!formality) return true;
  if (item.formality < formality.min) return false;
  if (item.formality > formality.max) return false;
  return true;
};

// Asymmetric: a warm trip should never include heavy pieces (you can't
// take off a parka), but a cold trip can include lighter pieces because
// they layer underneath. Symmetric |diff| > 2 used to fail both directions.
const matchesWarmth = (itemWarmth: number, targetWarmth: number): boolean => {
  if (targetWarmth <= 2) return itemWarmth <= targetWarmth + 1;
  return itemWarmth >= targetWarmth - 2;
};

// Treat the trip as a single "average" day for the scorer's weather component:
// no precipitation signal (a packing call is decided ahead of the forecast),
// just the midpoint temperature so warmth scoring lands on a sensible target.
const weatherContextForRange = (
  tempMinC: number,
  tempMaxC: number,
): WeatherContext => {
  return {
    tempC: (tempMinC + tempMaxC) / 2,
    precip: false,
  };
};

const computeItemValueByOutfits = (
  candidates: Item[],
  weather: WeatherContext,
): Map<string, number> => {
  const tops = preFilterCategory(candidates, "top");
  const bottoms = preFilterCategory(candidates, "bottom");
  const shoes = preFilterCategory(candidates, "shoes");
  const dresses = preFilterCategory(candidates, "dress");
  const outerwear = preFilterCategory(candidates, "outerwear");
  const includeOuter = shouldIncludeOuter(weather);

  const itemValue = new Map<string, number>();
  const recordOutfit = (outfit: Item[]) => {
    const score = scoreOutfit(outfit, { weather }).total;
    if (score < HIGH_SCORE_THRESHOLD) return;
    for (const item of outfit) addValue(itemValue, item.id, score);
  };

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        recordOutfit([top, bottom, shoe]);
        if (!includeOuter) continue;
        for (const outer of outerwear) {
          recordOutfit([top, bottom, shoe, outer]);
        }
      }
    }
  }

  for (const dress of dresses) {
    for (const shoe of shoes) {
      recordOutfit([dress, shoe]);
      if (!includeOuter) continue;
      for (const outer of outerwear) {
        recordOutfit([dress, shoe, outer]);
      }
    }
  }

  return itemValue;
};

const preFilterCategory = (candidates: Item[], category: Category): Item[] => {
  const pool = candidates.filter((item) => item.category === category);
  if (pool.length <= PER_CATEGORY_PREFILTER) return pool;
  return rankByColorMatch(pool, candidates, PER_CATEGORY_PREFILTER);
};

const shouldIncludeOuter = (weather: WeatherContext): boolean => {
  return weather.tempC < 16;
};

const addValue = (
  itemValue: Map<string, number>,
  itemId: string,
  delta: number,
): void => {
  const current = itemValue.get(itemId);
  if (current === undefined) {
    itemValue.set(itemId, delta);
    return;
  }
  itemValue.set(itemId, current + delta);
};

const rankByOutfitParticipation = (
  pool: Item[],
  itemValue: Map<string, number>,
  count: number,
  fallbackUniverse: Item[],
): Item[] => {
  const ranked = pool
    .map((item) => ({ item, value: lookupValue(itemValue, item) }))
    .sort((firstEntry, secondEntry) => secondEntry.value - firstEntry.value)
    .slice(0, count);

  // Cold-start guard: if no item in this category landed in any high-scoring
  // outfit (small or incoherent closet), fall back to the color-match
  // heuristic so the user still sees something rather than an empty slot.
  if (ranked.every((entry) => entry.value === 0)) {
    return rankByColorMatch(pool, fallbackUniverse, count);
  }
  return ranked.map((entry) => entry.item);
};

const lookupValue = (itemValue: Map<string, number>, item: Item): number => {
  const value = itemValue.get(item.id);
  if (value === undefined) return 0;
  return value;
};

const rankByColorMatch = (pool: Item[], universe: Item[], count: number): Item[] => {
  return pool
    .map((item) => ({ item, score: avgPairScore(item, otherCategoryItems(universe, item)) }))
    .sort((firstEntry, secondEntry) => secondEntry.score - firstEntry.score)
    .slice(0, count)
    .map((entry) => entry.item);
};

const otherCategoryItems = (universe: Item[], item: Item): Item[] => {
  return universe.filter((other) => other.category !== item.category);
};

const avgPairScore = (item: Item, others: Item[]): number => {
  if (others.length === 0) return 0;
  let sum = 0;
  for (const other of others) {
    const palette = [
      ...item.colors.slice(0, 2).map((color) => color.hsl),
      ...other.colors.slice(0, 2).map((color) => color.hsl),
    ];
    sum += paletteHarmony(palette).score;
  }
  return sum / others.length;
};

const emptyByCategory = (): Record<Category, Item[]> => ({
  top: [],
  bottom: [],
  dress: [],
  outerwear: [],
  shoes: [],
  bag: [],
  hat: [],
  accessory: [],
});

const warmthForRange = (min: number, max: number): number => {
  const avg = (min + max) / 2;
  if (avg >= 25) return 1;
  if (avg >= 18) return 2;
  if (avg >= 10) return 3;
  if (avg >= 2) return 4;
  return 4;
};
