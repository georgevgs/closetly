import type { Item, Category, Occasion, Style } from "../../types/items";
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
  preferredStyles?: ReadonlySet<Style>;
  itemWearCounts?: Map<string, number>;
  targetOccasion?: Occasion;
  limit?: number;
  includeOuterwear?: boolean;
};

const MIN_TOTAL_SCORE = 50;
const PREFILTER_KEEP = 8;
// Safety ceiling on the combinatorial expansion. With four slots and
// PREFILTER_KEEP = 8 we cap at 4096 today, but future extra slots (capsule
// pieces, accessories) would blow up multiplicatively. The cap is generous
// enough that real closets never hit it; it exists to keep the search
// bounded in pathological cases.
const MAX_COMBOS = 6000;

export function suggestOutfits(opts: CombinatorOptions): OutfitSuggestion[] {
  const {
    anchor,
    closet,
    weather,
    pairAffinity,
    recentlyWornItemIds,
    preferredStyles,
    itemWearCounts,
    targetOccasion,
    limit = 10,
    includeOuterwear,
  } = opts;

  const availableCloset = filterAvailable(closet, anchor);
  const filteredCloset = filterClosetByOccasion(availableCloset, anchor, targetOccasion);
  const withOuterwear = resolveIncludeOuterwear(includeOuterwear, weather);
  const slots = pickSlots(anchor, withOuterwear);
  const buckets = bucketByCategory(filteredCloset, anchor);
  const candidates = slots.map((slot) => candidatesForSlot(slot, anchor, buckets));

  if (hasMissingRequiredSlot(slots, candidates)) return [];

  const trimmed = trimCandidates(slots, candidates, anchor, weather);

  const combos: Item[][] = [];
  buildCombos(trimmed, 0, [], combos, MAX_COMBOS);

  const scored = combos.map((items) => ({
    items,
    score: scoreOutfit(items, {
      weather,
      pairAffinity,
      recentlyWornItemIds,
      preferredStyles,
      itemWearCounts,
    }),
  }));

  return scored
    .filter((suggestion) => suggestion.score.total >= MIN_TOTAL_SCORE)
    .sort((first, second) => second.score.rawTotal - first.score.rawTotal)
    .slice(0, limit);
}

const resolveIncludeOuterwear = (
  explicit: boolean | undefined,
  weather: WeatherContext | undefined,
): boolean => {
  if (explicit !== undefined) return explicit;
  return shouldAddOuter(weather);
};

const candidatesForSlot = (
  slot: Category,
  anchor: Item,
  buckets: Map<Category, Item[]>,
): Item[] => {
  if (slot === anchor.category) return [anchor];
  const items = buckets.get(slot);
  if (items === undefined) return [];
  return items;
};

const hasMissingRequiredSlot = (slots: Category[], candidates: Item[][]): boolean => {
  for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
    if (candidates[slotIndex].length > 0) continue;
    if (slots[slotIndex] !== "outerwear") return true;
  }
  return false;
};

const trimCandidates = (
  slots: Category[],
  candidates: Item[][],
  anchor: Item,
  weather: WeatherContext | undefined,
): Item[][] => {
  return candidates.map((slotCandidates, slotIndex) => {
    if (slots[slotIndex] === anchor.category) return slotCandidates;
    return prefilter(slotCandidates, anchor, weather).slice(0, PREFILTER_KEEP);
  });
};

// Pieces flagged as in the wash are unavailable — the user can't actually
// wear them today. The anchor is exempt because the user picked it
// explicitly (e.g. tapping "find outfits with this" from item detail).
const filterAvailable = (closet: Item[], anchor: Item): Item[] => {
  return closet.filter((item) => {
    if (item.id === anchor.id) return true;
    return !item.inWash;
  });
};

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

function shouldAddOuter(weather: WeatherContext | undefined): boolean {
  if (!weather) return false;
  return weather.tempC < 16 || weather.precip;
}

function bucketByCategory(closet: Item[], anchor: Item): Map<Category, Item[]> {
  const buckets = new Map<Category, Item[]>();
  for (const item of closet) {
    if (item.id === anchor.id) continue;
    const existing = buckets.get(item.category);
    if (existing) {
      existing.push(item);
      continue;
    }
    buckets.set(item.category, [item]);
  }
  return buckets;
}

type ScoredCandidate = { item: Item; quickScore: number };

function prefilter(
  items: Item[],
  anchor: Item,
  weather: WeatherContext | undefined,
): Item[] {
  const scored: ScoredCandidate[] = items.map((item) => ({
    item,
    quickScore: quickPairScore(item, anchor, weather),
  }));
  scored.sort((first, second) => second.quickScore - first.quickScore);
  return scored.map((entry) => entry.item);
}

function quickPairScore(
  item: Item,
  anchor: Item,
  weather: WeatherContext | undefined,
): number {
  let score = 50;
  score += formalityAdjustment(item, anchor);
  score += styleOverlapBonus(item, anchor);
  if (weather) score += seasonAdjustment(item, weather);
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
const seasonAdjustment = (item: Item, weather: WeatherContext): number => {
  if (item.seasons.length === 0) return 0;
  if (matchesCurrentSeasons(item.seasons, weather.tempC)) return 8;
  return -6;
};

const matchesCurrentSeasons = (seasons: Item["seasons"], tempC: number): boolean => {
  if (tempC >= 18) return seasons.includes("summer") || seasons.includes("spring");
  if (tempC >= 10) return seasons.includes("spring") || seasons.includes("autumn");
  return seasons.includes("autumn") || seasons.includes("winter");
};

function buildCombos(
  buckets: Item[][],
  bucketIndex: number,
  chosen: Item[],
  output: Item[][],
  maxCombos: number,
) {
  if (output.length >= maxCombos) return;
  if (bucketIndex === buckets.length) {
    output.push([...chosen]);
    return;
  }
  const bucket = buckets[bucketIndex];
  if (bucket.length === 0) {
    buildCombos(buckets, bucketIndex + 1, chosen, output, maxCombos);
    return;
  }
  for (const item of bucket) {
    if (output.length >= maxCombos) return;
    chosen.push(item);
    buildCombos(buckets, bucketIndex + 1, chosen, output, maxCombos);
    chosen.pop();
  }
}
