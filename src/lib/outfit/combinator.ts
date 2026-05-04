import type { Item, Category } from "../../types/items";
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
  limit?: number;
  includeOuterwear?: boolean;
};

export function suggestOutfits(opts: CombinatorOptions): OutfitSuggestion[] {
  const { anchor, closet, weather, pairAffinity, limit = 10, includeOuterwear } = opts;

  const slots = pickSlots(anchor, includeOuterwear ?? shouldAddOuter(weather));
  const buckets = bucketByCategory(closet, anchor);
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
    score: scoreOutfit(items, { weather, pairAffinity }),
  }));

  return scored
    .filter((s) => s.score.total >= 50)
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, limit);
}

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
  let s = 50;
  const formalityDiff = Math.abs(item.formality - anchor.formality);
  s += formalityDiff <= 1 ? 15 : -formalityDiff * 8;
  const styleOverlap = item.styles.filter((x) => anchor.styles.includes(x)).length;
  s += styleOverlap * 6;
  if (w) {
    const seasonOk =
      w.tempC >= 18
        ? item.seasons.includes("summer") || item.seasons.includes("spring")
        : w.tempC >= 10
          ? item.seasons.includes("spring") || item.seasons.includes("autumn")
          : item.seasons.includes("autumn") || item.seasons.includes("winter");
    s += seasonOk ? 8 : -6;
  }
  return s;
}

function buildCombos(buckets: Item[][], idx: number, acc: Item[], out: Item[][]) {
  if (out.length >= 200) return;
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
