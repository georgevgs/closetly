import type { HSL } from "../color/hsl";
import { paletteHarmony, pairHarmony, type PairScore } from "../color/harmony";
import { STYLE_ADJACENCY } from "../../types/items";
import type { Item, Style } from "../../types/items";
import { RECENCY, recencyPenaltyForDaysAgo } from "../../features/outfits/tuning";

export type ScoreBreakdown = {
  total: number;
  color: number;
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

const W_COLOR = 0.3;
const W_FORMALITY = 0.2;
const W_STYLE = 0.2;
const W_PATTERN = 0.1;
const W_WEATHER = 0.1;
const W_BALANCE = 0.1;

export type ScoreOptions = {
  weather?: WeatherContext;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
};

export function scoreOutfit(items: Item[], opts: ScoreOptions = {}): ScoreBreakdown {
  if (items.length === 0) return zeroBreakdown();

  const notes: string[] = [];

  const colorScore = scoreColor(items, notes);
  const formalityScore = scoreFormality(items, notes);
  const styleScore = scoreStyle(items, notes);
  const patternScore = scorePattern(items, notes);
  const weatherScore = computeWeatherScore(items, opts.weather, notes);
  const balanceScore = scoreBalance(items, notes);

  const components: WeightedComponent[] = [
    { value: colorScore, weight: W_COLOR },
    { value: formalityScore, weight: W_FORMALITY },
    { value: styleScore, weight: W_STYLE },
    { value: patternScore, weight: W_PATTERN },
    { value: weatherScore, weight: W_WEATHER },
    { value: balanceScore, weight: W_BALANCE },
  ];

  let total = weightedAverage(components);
  total += affinityBonus(items, opts.pairAffinity, notes);
  total -= computeRecencyPenalty(items, opts.recentlyWornItemIds, notes);

  return {
    total: clampPercentage(Math.round(total)),
    color: Math.round(colorScore),
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

const affinityBonus = (
  items: Item[],
  pairAffinity: Map<string, number> | undefined,
  notes: string[],
): number => {
  if (!pairAffinity) return 0;
  if (pairAffinity.size === 0) return 0;
  if (items.length < 2) return 0;

  let totalAffinity = 0;
  let knownPairs = 0;
  items.forEach((firstItem, firstIndex) => {
    const remaining = items.slice(firstIndex + 1);
    for (const secondItem of remaining) {
      const key = pairKey(firstItem.id, secondItem.id);
      const affinity = pairAffinity.get(key);
      if (affinity === undefined) continue;
      totalAffinity += affinity;
      knownPairs++;
    }
  });

  if (knownPairs === 0) return 0;
  const average = totalAffinity / knownPairs;
  if (average > 0.3) notes.push("Boosted by your favorites");
  return average * 5;
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
    total: 0,
    color: 0,
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

function scoreColor(items: Item[], notes: string[]): number {
  const colorsByItem: HSL[][] = items.map((i) =>
    i.colors.slice(0, 2).map((c) => c.hsl),
  );
  const flatColors = colorsByItem.flat();
  if (flatColors.length < 2) return 60;

  const crossItemPairs: PairScore[] = [];
  for (let i = 0; i < colorsByItem.length; i++) {
    for (let j = i + 1; j < colorsByItem.length; j++) {
      for (const ca of colorsByItem[i]) {
        for (const cb of colorsByItem[j]) {
          crossItemPairs.push(pairHarmony(ca, cb));
        }
      }
    }
  }
  if (crossItemPairs.length === 0) return 60;

  const result = paletteHarmony(flatColors, crossItemPairs);
  notes.push(...result.notes);
  return result.score;
}

function scoreFormality(items: Item[], notes: string[]): number {
  const formalities = items.map((i) => i.formality);
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
  const tally = new Map<Style, number>();
  for (const item of items) {
    for (const s of item.styles) bumpTally(tally, s);
  }
  if (tally.size === 0) return 70;

  const dominant = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const compatible = new Set<Style>([dominant, ...STYLE_ADJACENCY[dominant]]);

  let direct = 0;
  let adjacent = 0;
  for (const item of items) {
    if (item.styles.includes(dominant)) direct++;
    else if (item.styles.some((s) => compatible.has(s))) adjacent++;
  }
  const directRatio = direct / items.length;
  const compatibleRatio = (direct + adjacent) / items.length;

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
  const patterned = items.filter((i) => i.pattern !== "solid");
  if (patterned.length === 0) return 100;
  if (patterned.length === 1) return 100;
  if (patterned.length === 2) {
    notes.push("Two patterns — risky unless intentional");
    return 55;
  }
  notes.push("Too many patterns competing");
  return 30;
}

const WARMING_CATEGORIES = new Set<Item["category"]>([
  "top",
  "bottom",
  "dress",
  "outerwear",
]);

function scoreWeather(items: Item[], w: WeatherContext, notes: string[]): number {
  const totalWarmth = items.reduce(
    (s, i) => (WARMING_CATEGORIES.has(i.category) ? s + i.warmth : s),
    0,
  );
  const target = warmthForTemp(w.tempC);
  const diff = Math.abs(totalWarmth - target);
  let score = 100 - diff * 18;
  if (w.precip) {
    const hasOuter = items.some((i) => i.category === "outerwear");
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
}

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

export function pairKey(a: string, b: string): string {
  if (a < b) return `${a}|${b}`;
  return `${b}|${a}`;
}
