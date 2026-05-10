import type { Item, Category, Occasion } from "../../types/items";
import { scoreOutfit, type ScoreBreakdown, type WeatherContext } from "./score";

export type OutfitSuggestion = {
  items: Item[];
  score: ScoreBreakdown;
};

export type CombinatorOptions = {
  anchor: Item;
  closet: Item[];
  weather?: WeatherContext;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
  targetOccasion?: Occasion;
  limit?: number;
  includeOuterwear?: boolean;
};

export function suggestOutfits(opts: CombinatorOptions): OutfitSuggestion[] {
  const {
    anchor,
    closet,
    weather,
    pairAffinity,
    recentlyWornItemIds,
    targetOccasion,
    limit = 10,
    includeOuterwear,
  } = opts;

  const filteredCloset = filterClosetByOccasion(closet, anchor, targetOccasion);
  const slots = pickSlots(anchor, includeOuterwear ?? shouldAddOuter(weather));
  const buckets = bucketByCategory(filteredCloset, anchor);
  const candidates = slots.map((slot) => {
    if (slot === anchor.category) return [anchor];
    return buckets.get(slot) ?? [];
  });

  if (candidates.some((arr) => arr.length === 0)) {
    const required = slots.filter((s, i) => candidates[i].length === 0);
    if (required.some((s) => s !== "outerwear")) return [];
  }

  const trimmed = candidates.map((arr, i) =>
    slots[i] === anchor.category ? arr : prefilter(arr, anchor, weather).slice(0, 8)
  );

  const combos: Item[][] = [];
  buildCombos(trimmed, 0, [], combos);

  const scored = combos.map((items) => ({
    items,
    score: scoreOutfit(items, { weather, pairAffinity, recentlyWornItemIds }),
  }));

  return scored
    .filter((s) => s.score.total >= 50)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);
}

// The anchor itself is always included even if it doesn't match the
// occasion — the user picked it explicitly. The filter only narrows the
// supporting pieces. Items with no occasions stay neutral so a closet
// where most pieces are untagged still produces suggestions.
const filterClosetByOccasion = (
  closet: Item[],
  anchor: Item,
  target: Occasion | undefined,
): Item[] => {
  if (target === undefined) return closet;
  return closet.filter((item) => {
    if (item.id === anchor.id) return true;
    if (item.occasions.length === 0) return true;
    return item.occasions.includes(target);
  });
};

function pickSlots(anchor: Item, withOuterwear: boolean): Category[] {
  if (anchor.category === "dress") {
    const base: Category[] = ["dress", "shoes"];
    if (withOuterwear) base.push("outerwear");
    return base;
  }
  const base: Category[] = ["top", "bottom", "shoes"];
  if (withOuterwear) base.push("outerwear");
  if (!base.includes(anchor.category)) base.push(anchor.category);
  return base;
}

function shouldAddOuter(w?: WeatherContext): boolean {
  if (!w) return false;
  return w.tempC < 16 || w.precip;
}

function bucketByCategory(closet: Item[], anchor: Item): Map<Category, Item[]> {
  const map = new Map<Category, Item[]>();
  for (const item of closet) {
    if (item.id === anchor.id) continue;
    const arr = map.get(item.category) ?? [];
    arr.push(item);
    map.set(item.category, arr);
  }
  return map;
}

function prefilter(items: Item[], anchor: Item, w?: WeatherContext): Item[] {
  return items
    .map((item) => ({ item, s: quickPairScore(item, anchor, w) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item);
}

function quickPairScore(item: Item, anchor: Item, w?: WeatherContext): number {
  let score = 50;
  score += formalityAdjustment(item, anchor);
  score += styleOverlapBonus(item, anchor);
  if (w) score += seasonAdjustment(item, w);
  return score;
}

const formalityAdjustment = (item: Item, anchor: Item): number => {
  const diff = Math.abs(item.formality - anchor.formality);
  if (diff <= 1) return 15;
  return -diff * 8;
};

const styleOverlapBonus = (item: Item, anchor: Item): number => {
  const overlap = item.styles.filter((style) => anchor.styles.includes(style)).length;
  return overlap * 6;
};

// Items with no seasons set are "user hasn't decided" — treat as neutral
// instead of a -6 penalty (which previously hid them behind explicitly-tagged
// items). The anchorPicker already takes the same neutral stance; this aligns
// the prefilter with it.
const seasonAdjustment = (item: Item, w: WeatherContext): number => {
  if (item.seasons.length === 0) return 0;
  if (matchesCurrentSeasons(item.seasons, w.tempC)) return 8;
  return -6;
};

const matchesCurrentSeasons = (seasons: Item["seasons"], tempC: number): boolean => {
  if (tempC >= 18) return seasons.includes("summer") || seasons.includes("spring");
  if (tempC >= 10) return seasons.includes("spring") || seasons.includes("autumn");
  return seasons.includes("autumn") || seasons.includes("winter");
};

function buildCombos(buckets: Item[][], idx: number, acc: Item[], out: Item[][]) {
  if (idx === buckets.length) {
    out.push([...acc]);
    return;
  }
  const bucket = buckets[idx];
  if (bucket.length === 0) {
    buildCombos(buckets, idx + 1, acc, out);
    return;
  }
  for (const item of bucket) {
    acc.push(item);
    buildCombos(buckets, idx + 1, acc, out);
    acc.pop();
  }
}
