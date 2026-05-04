import type { HSL } from "../color/hsl";
import { paletteHarmony } from "../color/harmony";
import type { Item, Style } from "../../types/items";

export type ScoreBreakdown = {
  total: number;
  color: number;
  formality: number;
  style: number;
  pattern: number;
  weather: number;
  notes: string[];
};

export type WeatherContext = {
  tempC: number;
  precip: boolean;
};

const W_COLOR = 0.4;
const W_FORMALITY = 0.2;
const W_STYLE = 0.2;
const W_PATTERN = 0.1;
const W_WEATHER = 0.1;

export function scoreOutfit(
  items: Item[],
  opts: { weather?: WeatherContext; pairAffinity?: Map<string, number> } = {}
): ScoreBreakdown {
  if (items.length === 0) {
    return { total: 0, color: 0, formality: 0, style: 0, pattern: 0, weather: 0, notes: [] };
  }
  const notes: string[] = [];

  const colorScore = scoreColor(items, notes);
  const formalityScore = scoreFormality(items, notes);
  const styleScore = scoreStyle(items, notes);
  const patternScore = scorePattern(items, notes);
  const weatherScore = opts.weather ? scoreWeather(items, opts.weather, notes) : 75;

  let total =
    colorScore * W_COLOR +
    formalityScore * W_FORMALITY +
    styleScore * W_STYLE +
    patternScore * W_PATTERN +
    weatherScore * W_WEATHER;

  if (opts.pairAffinity && opts.pairAffinity.size > 0) {
    let bonus = 0;
    let pairs = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const k = pairKey(items[i].id, items[j].id);
        const aff = opts.pairAffinity.get(k);
        if (aff !== undefined) {
          bonus += aff;
          pairs++;
        }
      }
    }
    if (pairs > 0) {
      const avg = bonus / pairs;
      total += avg * 5;
      if (avg > 0.5) notes.push("Boosted by your favorites");
    }
  }

  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    color: Math.round(colorScore),
    formality: Math.round(formalityScore),
    style: Math.round(styleScore),
    pattern: Math.round(patternScore),
    weather: Math.round(weatherScore),
    notes,
  };
}

function scoreColor(items: Item[], notes: string[]): number {
  const palette: HSL[] = items.flatMap((i) => i.colors.slice(0, 2).map((c) => c.hsl));
  if (palette.length < 2) return 60;
  const result = paletteHarmony(palette);
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

function scoreStyle(items: Item[], notes: string[]): number {
  const tally = new Map<Style, number>();
  for (const item of items) {
    for (const s of item.styles) tally.set(s, (tally.get(s) ?? 0) + 1);
  }
  if (tally.size === 0) return 70;
  const entries = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const dominant = entries[0];
  const overlap = dominant[1] / items.length;
  if (overlap >= 0.75) {
    notes.push(`Coherent ${dominant[0]} aesthetic`);
    return 95;
  }
  if (overlap >= 0.5) return 78;
  return 55;
}

function scorePattern(items: Item[], notes: string[]): number {
  const patterned = items.filter((i) => i.pattern !== "solid");
  if (patterned.length === 0) return 90;
  if (patterned.length === 1) return 100;
  if (patterned.length === 2) {
    notes.push("Two patterns — risky unless intentional");
    return 55;
  }
  notes.push("Too many patterns competing");
  return 30;
}

function scoreWeather(items: Item[], w: WeatherContext, notes: string[]): number {
  const totalWarmth = items.reduce((s, i) => s + i.warmth, 0);
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

function warmthForTemp(t: number): number {
  if (t >= 25) return 1;
  if (t >= 18) return 2;
  if (t >= 10) return 4;
  if (t >= 2) return 6;
  return 8;
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
