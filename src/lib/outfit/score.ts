import { isNeutral, hueDistance, type HSL } from "../color/hsl";
import { paletteHarmony, pairHarmony, type PairScore } from "../color/harmony";
import { STYLE_ADJACENCY } from "../../types/items";
import type { Category, Item, Silhouette, Style } from "../../types/items";
import {
  RECENCY,
  STYLE_PREFERENCE,
  CORE_WARDROBE,
  coreWardrobeBonusFor,
  recencyPenaltyForDaysAgo,
} from "../../features/outfits/tuning";

export type ScoreBreakdown = {
  // Unclamped score used for sort and diversity reranking. Outfits with strong
  // wear history can exceed 100 once bonuses stack; preserving the raw value
  // keeps ordering stable within the saturated top tier.
  rawTotal: number;
  // Clamped 0-100 score for display. Always equals clamp(rawTotal).
  total: number;
  // null = no colored pairs available (e.g. no colors extracted yet). The
  // component is dropped from the weighted average instead of contributing a
  // misleading neutral score.
  color: number | null;
  // 60-30-10 distribution at item level — separate from raw color harmony.
  // null = not enough colored items to assess proportion.
  proportion: number | null;
  formality: number;
  style: number;
  pattern: number;
  // null = no signal for this outfit (e.g. no weather data, or no silhouette
  // fit on either upper or lower piece). The component is dropped from the
  // weighted average instead of contributing a misleading "neutral" 75.
  weather: number | null;
  balance: number | null;
  notes: string[];
};

export type WeatherContext = {
  tempC: number;
  precip: boolean;
};

// Color carries the most weight; proportion is closely related but graded
// separately so a great palette with too many statement pieces gets called
// out instead of averaging into a flat color score.
const W_COLOR = 0.22;
const W_PROPORTION = 0.08;
const W_FORMALITY = 0.2;
const W_STYLE = 0.2;
const W_PATTERN = 0.1;
const W_WEATHER = 0.1;
const W_BALANCE = 0.1;

export type ScoreOptions = {
  weather?: WeatherContext;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
  // User vibes picked at onboarding (or in Profile). Bias the algorithm
  // toward outfits that lean into the user's chosen aesthetic — cold-start
  // personalization that doesn't require any wear history.
  preferredStyles?: ReadonlySet<Style>;
  // Per-item lifetime wear counts. Used to lean lightly into the user's
  // proven favorites once the closet has accumulated history.
  itemWearCounts?: Map<string, number>;
};

export function scoreOutfit(items: Item[], opts: ScoreOptions = {}): ScoreBreakdown {
  if (items.length === 0) return zeroBreakdown();

  const notes: string[] = [];

  const colorScore = scoreColor(items, notes);
  const proportionScore = scoreProportion(items, notes);
  const formalityScore = scoreFormality(items, notes);
  const styleScore = scoreStyle(items, notes);
  const patternScore = scorePattern(items, notes);
  const weatherScore = computeWeatherScore(items, opts.weather, notes);
  const balanceScore = scoreBalance(items, notes);

  const components: WeightedComponent[] = [
    { value: colorScore, weight: W_COLOR },
    { value: proportionScore, weight: W_PROPORTION },
    { value: formalityScore, weight: W_FORMALITY },
    { value: styleScore, weight: W_STYLE },
    { value: patternScore, weight: W_PATTERN },
    { value: weatherScore, weight: W_WEATHER },
    { value: balanceScore, weight: W_BALANCE },
  ];

  let rawTotal = weightedAverage(components);
  rawTotal += affinityBonus(items, opts.pairAffinity, notes);
  rawTotal += stylePreferenceBonus(items, opts.preferredStyles, notes);
  rawTotal += coreWardrobeBonus(items, opts.itemWearCounts, notes);
  rawTotal -= computeRecencyPenalty(items, opts.recentlyWornItemIds, notes);

  const roundedRaw = Math.round(rawTotal);
  return {
    rawTotal: roundedRaw,
    total: clampPercentage(roundedRaw),
    color: roundOrNull(colorScore),
    proportion: roundOrNull(proportionScore),
    formality: Math.round(formalityScore),
    style: Math.round(styleScore),
    pattern: Math.round(patternScore),
    weather: roundOrNull(weatherScore),
    balance: roundOrNull(balanceScore),
    notes,
  };
}

type WeightedComponent = { value: number | null; weight: number };

const weightedAverage = (components: WeightedComponent[]): number => {
  let weightedSum = 0;
  let activeWeight = 0;
  for (const component of components) {
    if (component.value === null) continue;
    weightedSum += component.value * component.weight;
    activeWeight += component.weight;
  }
  if (activeWeight === 0) return 0;
  return weightedSum / activeWeight;
};

const computeWeatherScore = (
  items: Item[],
  weather: WeatherContext | undefined,
  notes: string[],
): number | null => {
  if (weather === undefined) return null;
  return scoreWeather(items, weather, notes);
};

// Treat unknown pairs as 0 affinity rather than excluding them from the
// average. An outfit where six of six pairs are mildly liked is stronger
// evidence than one where one of six pairs is strongly liked; dividing by
// the total pair count instead of the known-pair count makes the bonus
// reflect coverage as well as magnitude.
const affinityBonus = (
  items: Item[],
  pairAffinity: Map<string, number> | undefined,
  notes: string[],
): number => {
  if (!pairAffinity) return 0;
  if (pairAffinity.size === 0) return 0;
  if (items.length < 2) return 0;

  const totalPairs = (items.length * (items.length - 1)) / 2;
  let sumAffinity = 0;
  let knownPairs = 0;
  items.forEach((firstItem, firstIndex) => {
    const remaining = items.slice(firstIndex + 1);
    for (const secondItem of remaining) {
      const key = pairKey(firstItem.id, secondItem.id);
      const affinity = pairAffinity.get(key);
      if (affinity === undefined) continue;
      sumAffinity += affinity;
      knownPairs++;
    }
  });

  if (knownPairs === 0) return 0;
  const meanOverAllPairs = sumAffinity / totalPairs;
  if (meanOverAllPairs > 0.2) notes.push("Boosted by your favorites");
  return meanOverAllPairs * 5;
};

// Bias toward outfits whose items match the vibes the user picked at
// onboarding. Bounded so it nudges suggestion ordering without overriding
// stylist rules — a "minimal" user still gets called out for a 5-pattern
// outfit, just nudged toward minimal-leaning candidates first.
const stylePreferenceBonus = (
  items: Item[],
  preferredStyles: ReadonlySet<Style> | undefined,
  notes: string[],
): number => {
  if (!preferredStyles) return 0;
  if (preferredStyles.size === 0) return 0;

  let bonus = 0;
  for (const item of items) {
    if (item.styles.length === 0) continue;
    if (item.styles.some((style) => preferredStyles.has(style))) {
      bonus += STYLE_PREFERENCE.perItemBonus;
    }
  }
  if (bonus > STYLE_PREFERENCE.outfitCap) bonus = STYLE_PREFERENCE.outfitCap;
  if (bonus >= STYLE_PREFERENCE.outfitCap * 0.6) {
    notes.push("Leans into your style");
  }
  return bonus;
};

const coreWardrobeBonus = (
  items: Item[],
  itemWearCounts: Map<string, number> | undefined,
  notes: string[],
): number => {
  if (!itemWearCounts) return 0;
  if (itemWearCounts.size === 0) return 0;

  let bonus = 0;
  let highUsageItems = 0;
  for (const item of items) {
    const wearCount = itemWearCounts.get(item.id);
    if (wearCount === undefined) continue;
    bonus += coreWardrobeBonusFor(wearCount);
    if (wearCount >= 5) highUsageItems++;
  }
  if (bonus > CORE_WARDROBE.outfitCap) bonus = CORE_WARDROBE.outfitCap;
  if (highUsageItems >= 2) {
    notes.push("Built from your reliable favorites");
  }
  return bonus;
};

const computeRecencyPenalty = (
  items: Item[],
  recentlyWornItemIds: Map<string, number> | undefined,
  notes: string[],
): number => {
  if (!recentlyWornItemIds) return 0;
  if (recentlyWornItemIds.size === 0) return 0;

  let totalPenalty = 0;
  for (const item of items) {
    const daysAgo = recentlyWornItemIds.get(item.id);
    if (daysAgo === undefined) continue;
    totalPenalty += recencyPenaltyForDaysAgo(daysAgo);
  }
  if (totalPenalty > RECENCY.maxOutfitPenalty) totalPenalty = RECENCY.maxOutfitPenalty;
  if (totalPenalty > 0) notes.push(recencyNoteFor(totalPenalty));
  return totalPenalty;
};

const recencyNoteFor = (penalty: number): string => {
  if (penalty >= 15) return "You've worn most of this very recently";
  return "Some pieces worn recently";
};

const zeroBreakdown = (): ScoreBreakdown => {
  return {
    rawTotal: 0,
    total: 0,
    color: null,
    proportion: null,
    formality: 0,
    style: 0,
    pattern: 0,
    weather: null,
    balance: null,
    notes: [],
  };
};

const roundOrNull = (value: number | null): number | null => {
  if (value === null) return null;
  return Math.round(value);
};

const clampPercentage = (value: number): number => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

// Returns null when there isn't enough color data to assess harmony — i.e.
// fewer than two extracted colors across the outfit, or no cross-item pairs.
// The weighted average drops the component in that case rather than averaging
// in a misleading neutral score.
function scoreColor(items: Item[], notes: string[]): number | null {
  const colorsByItem: HSL[][] = items.map((item) =>
    item.colors.slice(0, 2).map((color) => color.hsl),
  );
  const flatColors = colorsByItem.flat();
  if (flatColors.length < 2) return null;

  const crossItemPairs: PairScore[] = [];
  for (let firstIndex = 0; firstIndex < colorsByItem.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < colorsByItem.length; secondIndex++) {
      for (const firstColor of colorsByItem[firstIndex]) {
        for (const secondColor of colorsByItem[secondIndex]) {
          crossItemPairs.push(pairHarmony(firstColor, secondColor));
        }
      }
    }
  }
  if (crossItemPairs.length === 0) return null;

  const result = paletteHarmony(flatColors, crossItemPairs);
  notes.push(...result.notes);
  return result.score;
}

// 60-30-10 at item level: dominant garments + supporting + accent. We can't
// measure pixel area without rendering, so we proxy area by category (large
// pieces: top/bottom/dress/outerwear) and ask whether the *number* of
// chromatic items is distributed like a styled palette would be.
//
// Ideal: at most one or two saturated statement items, with at least one
// neutral piece carrying the silhouette. Three+ chromatic competing items
// is the classic "too much color" mistake.
const LARGE_CATEGORIES: ReadonlySet<Category> = new Set<Category>([
  "top",
  "bottom",
  "dress",
  "outerwear",
]);

const ACCENT_CATEGORIES: ReadonlySet<Category> = new Set<Category>([
  "shoes",
  "bag",
  "hat",
  "accessory",
]);

const dominantColorOf = (item: Item): HSL | null => {
  if (item.colors.length === 0) return null;
  return item.colors[0].hsl;
};

const isChromaticItem = (item: Item): boolean => {
  const color = dominantColorOf(item);
  if (!color) return false;
  return !isNeutral(color);
};

function scoreProportion(items: Item[], notes: string[]): number | null {
  const itemsWithColor = items.filter((item) => item.colors.length > 0);
  if (itemsWithColor.length < 2) return null;

  const chromaticItems = itemsWithColor.filter(isChromaticItem);
  const largeChromatic = chromaticItems.filter((item) =>
    LARGE_CATEGORIES.has(item.category),
  );
  const accentChromatic = chromaticItems.filter((item) =>
    ACCENT_CATEGORIES.has(item.category),
  );
  const hasNeutralAnchor = itemsWithColor.some((item) => !isChromaticItem(item));

  if (chromaticItems.length === 0) {
    notes.push("All-neutral palette");
    return 78;
  }
  if (chromaticItems.length === 1) {
    if (accentChromatic.length === 1) {
      notes.push("Clean palette with a colored accent");
      return 96;
    }
    if (hasNeutralAnchor) {
      notes.push("Statement piece anchored in neutrals");
      return 94;
    }
    return 86;
  }
  if (chromaticItems.length === 2) {
    if (largeChromatic.length <= 1 && hasNeutralAnchor) {
      notes.push("Balanced 60-30-10 with a neutral base");
      return 88;
    }
    if (largeChromatic.length === 2 && !hasNeutralAnchor) {
      notes.push("Two colored statement pieces — add a neutral to ground them");
      return 60;
    }
    return 74;
  }
  // 3+ chromatic items
  notes.push("Too many colors competing — drop one to a neutral");
  return Math.max(40, 78 - (chromaticItems.length - 2) * 12);
}

function scoreFormality(items: Item[], notes: string[]): number {
  const formalities = items.map((item) => item.formality);
  const min = Math.min(...formalities);
  const max = Math.max(...formalities);
  const spread = max - min;
  if (spread === 0) return 100;
  if (spread === 1) return 88;
  if (spread === 2) {
    notes.push("Mixed formality — could feel intentional or off");
    return 65;
  }
  notes.push("Formality clash — items span casual to formal");
  return 35;
}

const bumpTally = <K>(tally: Map<K, number>, key: K) => {
  const current = tally.get(key);
  if (current === undefined) {
    tally.set(key, 1);
    return;
  }
  tally.set(key, current + 1);
};

function scoreStyle(items: Item[], notes: string[]): number {
  const styled = items.filter((item) => item.styles.length > 0);
  if (styled.length === 0) return 70;

  const tally = new Map<Style, number>();
  for (const item of styled) {
    for (const style of item.styles) bumpTally(tally, style);
  }

  const dominant = [...tally.entries()].sort(
    (firstEntry, secondEntry) => secondEntry[1] - firstEntry[1],
  )[0][0];
  const compatible = new Set<Style>([dominant, ...STYLE_ADJACENCY[dominant]]);

  let direct = 0;
  let adjacent = 0;
  for (const item of styled) {
    if (item.styles.includes(dominant)) direct++;
    else if (item.styles.some((style) => compatible.has(style))) adjacent++;
  }
  // Denominator is the styled count, not the full outfit, so an item with no
  // tags is treated as neutral rather than silently dragging the ratio down.
  const directRatio = direct / styled.length;
  const compatibleRatio = (direct + adjacent) / styled.length;

  if (compatibleRatio >= 0.75) {
    if (directRatio >= 0.75) {
      notes.push(`Coherent ${dominant} aesthetic`);
      return 95;
    }
    notes.push(`Compatible ${dominant} aesthetic`);
    return 82;
  }
  if (compatibleRatio >= 0.5) return 70;
  return 55;
}

function scorePattern(items: Item[], notes: string[]): number {
  const patterned = items.filter((item) => item.pattern !== "solid");
  if (patterned.length === 0) return 100;
  if (patterned.length === 1) return 100;
  if (patterned.length === 2) {
    return scoreTwoPatterns(patterned, notes);
  }
  notes.push("Too many patterns competing");
  return 30;
}

// Industry rule: two patterns work when (a) they're on small/accent pieces
// only, or (b) they share a color family so the eye reads them as a set.
// Otherwise the outfit fights with itself.
const scoreTwoPatterns = (patterned: Item[], notes: string[]): number => {
  const [firstPatterned, secondPatterned] = patterned;
  if (areBothAccentPieces(patterned)) {
    notes.push("Two accent patterns — playful and intentional");
    return 80;
  }
  if (sharesPatternColorFamily(firstPatterned, secondPatterned)) {
    notes.push("Two patterns sharing a color — feels intentional");
    return 78;
  }
  notes.push("Two patterns competing — keep one solid for safety");
  return 55;
};

const areBothAccentPieces = (patterned: Item[]): boolean => {
  return patterned.every((item) => ACCENT_CATEGORIES.has(item.category));
};

const sharesPatternColorFamily = (first: Item, second: Item): boolean => {
  const firstColor = dominantColorOf(first);
  const secondColor = dominantColorOf(second);
  if (!firstColor || !secondColor) return false;
  if (isNeutral(firstColor) || isNeutral(secondColor)) return true;
  return hueDistance(firstColor.h, secondColor.h) <= 35;
};

const WARMING_CATEGORIES = new Set<Item["category"]>([
  "top",
  "bottom",
  "dress",
  "outerwear",
]);

function scoreWeather(items: Item[], weather: WeatherContext, notes: string[]): number {
  let totalWarmth = 0;
  for (const item of items) {
    if (WARMING_CATEGORIES.has(item.category)) totalWarmth += item.warmth;
  }
  const target = warmthForTemp(weather.tempC);
  const diff = Math.abs(totalWarmth - target);
  let score = 100 - diff * 18;
  if (weather.precip) {
    const hasOuter = items.some((item) => item.category === "outerwear");
    if (!hasOuter) {
      score -= 15;
      notes.push("Rain expected — add an outer layer");
    }
  }
  return Math.max(20, Math.min(100, score));
}

function scoreBalance(items: Item[], notes: string[]): number | null {
  const upper = pickUpperPiece(items);
  const lower = pickLowerPiece(items);
  if (!upper || !lower) return null;

  const upperVolume = volumeOf(upper);
  const lowerVolume = volumeOf(lower);
  if (upperVolume === null || lowerVolume === null) return null;

  const baseScore = fitContrastScore(upperVolume, lowerVolume, notes);
  const proportionAdjustment = lengthProportionAdjustment(upper, lower, notes);
  return clampBalance(baseScore + proportionAdjustment);
}

const clampBalance = (value: number): number => {
  if (value < 30) return 30;
  if (value > 100) return 100;
  return value;
};

const fitContrastScore = (
  upperVolume: number,
  lowerVolume: number,
  notes: string[],
): number => {
  const diff = Math.abs(upperVolume - lowerVolume);
  if (diff === 0) {
    if (upperVolume >= 4) {
      notes.push("Both pieces oversized — silhouette feels shapeless");
      return 55;
    }
    if (upperVolume === 3) {
      notes.push("Both pieces relaxed — risk of looking sloppy");
      return 72;
    }
    return 82;
  }
  if (diff === 1) return 88;
  if (diff === 2) {
    notes.push("Balanced silhouette — fitted with relaxed");
    return 95;
  }
  return 90;
};

// Rule of thirds: a cropped piece on top with a fuller / longer piece below
// reads sharper than two full-length pieces stacked. We only add or subtract
// a few points so the fit-contrast score remains the dominant signal.
const lengthProportionAdjustment = (
  upper: Item,
  lower: Item,
  notes: string[],
): number => {
  const upperLength = lengthOf(upper);
  const lowerLength = lengthOf(lower);
  if (!upperLength || !lowerLength) return 0;

  if (upperLength === "cropped" && lowerLength !== "cropped") {
    notes.push("Cropped top with longer bottom — clean thirds");
    return 5;
  }
  if (upperLength === "long" && lowerLength === "long") {
    notes.push("Both pieces full-length — try a cropped layer for proportion");
    return -6;
  }
  if (upperLength === "long" && lowerLength === "cropped") {
    notes.push("Long top over cropped bottom — bold proportion choice");
    return -2;
  }
  return 0;
};

const lengthOf = (item: Item): Silhouette["length"] | null => {
  const length = item.silhouette?.length;
  if (!length) return null;
  if (length === "na") return null;
  return length;
};

// Outerwear dominates the visible top-half silhouette when worn.
const pickUpperPiece = (items: Item[]): Item | undefined => {
  const outer = items.find((item) => item.category === "outerwear");
  if (outer) return outer;
  return items.find((item) => item.category === "top");
};

const pickLowerPiece = (items: Item[]): Item | undefined => {
  const bottom = items.find((item) => item.category === "bottom");
  if (bottom) return bottom;
  return items.find((item) => item.category === "dress");
};

const FIT_VOLUME: Record<NonNullable<Item["silhouette"]>["fit"], number> = {
  slim: 1,
  regular: 2,
  relaxed: 3,
  oversized: 4,
};

const volumeOf = (item: Item): number | null => {
  const fit = item.silhouette?.fit;
  if (!fit) return null;
  return FIT_VOLUME[fit];
};

const warmthForTemp = (tempC: number): number => {
  if (tempC >= 25) return 1;
  if (tempC >= 18) return 2;
  if (tempC >= 10) return 4;
  if (tempC >= 2) return 6;
  return 8;
};

export function pairKey(firstId: string, secondId: string): string {
  if (firstId < secondId) return `${firstId}|${secondId}`;
  return `${secondId}|${firstId}`;
}
