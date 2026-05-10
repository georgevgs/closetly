import type { HSL } from "../color/hsl";
import { paletteHarmony, pairHarmony, type PairScore } from "../color/harmony";
import { STYLE_ADJACENCY } from "../../types/items";
import type { Item, Style } from "../../types/items";

export type ScoreBreakdown = {
  total: number;
  color: number;
  formality: number;
  style: number;
  pattern: number;
  weather: number;
  balance: number;
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

export function scoreOutfit(
  items: Item[],
  opts: { weather?: WeatherContext; pairAffinity?: Map<string, number> } = {}
): ScoreBreakdown {
  if (items.length === 0) {
    return {
      total: 0,
      color: 0,
      formality: 0,
      style: 0,
      pattern: 0,
      weather: 0,
      balance: 0,
      notes: [],
    };
  }
  const notes: string[] = [];

  const colorScore = scoreColor(items, notes);
  const formalityScore = scoreFormality(items, notes);
  const styleScore = scoreStyle(items, notes);
  const patternScore = scorePattern(items, notes);
  let weatherScore = 75;
  if (opts.weather) weatherScore = scoreWeather(items, opts.weather, notes);
  const balanceScore = scoreBalance(items, notes);

  let total =
    colorScore * W_COLOR +
    formalityScore * W_FORMALITY +
    styleScore * W_STYLE +
    patternScore * W_PATTERN +
    weatherScore * W_WEATHER +
    balanceScore * W_BALANCE;

  if (opts.pairAffinity && opts.pairAffinity.size > 0 && items.length >= 2) {
    let bonus = 0;
    let known = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const k = pairKey(items[i].id, items[j].id);
        const aff = opts.pairAffinity.get(k);
        if (aff !== undefined) {
          bonus += aff;
          known++;
        }
      }
    }
    if (known > 0) {
      const avg = bonus / known;
      total += avg * 5;
      if (avg > 0.3) notes.push("Boosted by your favorites");
    }
  }

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    color: Math.round(colorScore),
    formality: Math.round(formalityScore),
    style: Math.round(styleScore),
    pattern: Math.round(patternScore),
    weather: Math.round(weatherScore),
    balance: Math.round(balanceScore),
    notes,
  };
}

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

function scoreBalance(items: Item[], notes: string[]): number {
  const top = items.find((i) => i.category === "top");
  const bottom = items.find((i) => i.category === "bottom");
  const dress = items.find((i) => i.category === "dress");
  const outer = items.find((i) => i.category === "outerwear");

  // When outerwear is worn it dominates the visible top-half silhouette.
  let upper = outer;
  if (!upper) upper = top;
  let lower = bottom;
  if (!lower) lower = dress;

  if (!upper || !lower) return 75;

  const upperVol = volumeOf(upper);
  const lowerVol = volumeOf(lower);
  if (upperVol == null || lowerVol == null) return 75;

  const diff = Math.abs(upperVol - lowerVol);
  if (diff === 0) {
    if (upperVol >= 4) {
      notes.push("Both pieces oversized — silhouette feels shapeless");
      return 55;
    }
    if (upperVol === 3) {
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

const FIT_VOLUME: Record<NonNullable<Item["silhouette"]>["fit"], number> = {
  slim: 1,
  regular: 2,
  relaxed: 3,
  oversized: 4,
};

function volumeOf(item: Item): number | null {
  const fit = item.silhouette?.fit;
  if (!fit) return null;
  return FIT_VOLUME[fit];
}

function warmthForTemp(t: number): number {
  if (t >= 25) return 1;
  if (t >= 18) return 2;
  if (t >= 10) return 4;
  if (t >= 2) return 6;
  return 8;
}

export function pairKey(a: string, b: string): string {
  if (a < b) return `${a}|${b}`;
  return `${b}|${a}`;
}
