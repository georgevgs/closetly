import type { HSL } from "./hsl";
import { hueDistance, isDark, isLight, isMuted, isNeutral } from "./hsl";

export type HarmonyType =
  | "monochromatic"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "neutral-anchor"
  | "tonal"
  | "clash";

export type PairScore = {
  score: number;
  type: HarmonyType;
};

export function pairHarmony(firstColor: HSL, secondColor: HSL): PairScore {
  const firstIsNeutral = isNeutral(firstColor);
  const secondIsNeutral = isNeutral(secondColor);

  if (firstIsNeutral && secondIsNeutral) {
    const lightnessDiff = Math.abs(firstColor.l - secondColor.l);
    return { score: 70 + Math.min(lightnessDiff, 0.5) * 60, type: "tonal" };
  }
  if (firstIsNeutral || secondIsNeutral) {
    return { score: 90, type: "neutral-anchor" };
  }

  const hueGap = hueDistance(firstColor.h, secondColor.h);
  const saturationAverage = (firstColor.s + secondColor.s) / 2;

  if (hueGap <= 12) {
    const lightnessDiff = Math.abs(firstColor.l - secondColor.l);
    return { score: 75 + Math.min(lightnessDiff, 0.5) * 50, type: "monochromatic" };
  }
  if (hueGap <= 35) return { score: 85, type: "analogous" };
  if (hueGap >= 165) {
    return { score: complementaryScore(saturationAverage), type: "complementary" };
  }
  if (hueGap >= 145 && hueGap < 165) return { score: 80, type: "split-complementary" };
  if (hueGap >= 110 && hueGap < 135) return { score: 72, type: "triadic" };

  return { score: clashScoreForSaturation(saturationAverage), type: "clash" };
}

// Vivid complementary pairs read as louder than muted ones — pull the score
// down when both colors are saturated so a punchy red+green doesn't outscore
// a softer rust+sage.
const complementaryScore = (saturationAverage: number): number => {
  if (saturationAverage > 0.7) return 70;
  return 90;
};

// Stylists routinely pair muted-but-clashing hues (e.g. dusty rose with sage).
// The clash penalty was previously a binary 35-or-55 and over-punished low-
// saturation outfits. We grade it instead so vivid clashes still score poorly
// but tonal "clashes" stay viable.
const clashScoreForSaturation = (saturationAverage: number): number => {
  if (saturationAverage > 0.65) return 35;
  if (saturationAverage > 0.45) return 50;
  if (saturationAverage > 0.25) return 62;
  return 70;
};

export function paletteHarmony(
  colors: HSL[],
  externalPairs?: PairScore[],
): {
  score: number;
  pairs: PairScore[];
  notes: string[];
} {
  if (colors.length < 2 && (!externalPairs || externalPairs.length === 0)) {
    return { score: 50, pairs: [], notes: [] };
  }

  const pairs = pairsToScore(externalPairs, colors);
  const average = averagePairScore(pairs);

  const notes: string[] = [];
  let score = average;

  const chromaCount = colors.filter((color) => !isNeutral(color)).length;
  if (chromaCount > 3) {
    score -= 12;
    notes.push("Too many chromatic colors — keep to ≤3 saturated hues");
  } else if (chromaCount <= 2 && colors.length >= 3) {
    score += 4;
    notes.push("Clean 60-30-10 distribution");
  }

  const hasAnchor = colors.some(
    (color) => isNeutral(color) && (isDark(color) || isLight(color)),
  );
  if (hasAnchor) {
    score += 3;
    notes.push("Neutral anchor present");
  }

  const darkCount = colors.filter(isDark).length;
  const lightCount = colors.filter(isLight).length;
  if (darkCount > 0 && lightCount > 0) {
    score += 4;
    notes.push("Light/dark contrast");
  }

  const allMuted = colors.every(isMuted);
  if (allMuted && colors.length >= 3) {
    score += 2;
    notes.push("Cohesive muted palette");
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), pairs, notes };
}

const pairsToScore = (
  externalPairs: PairScore[] | undefined,
  colors: HSL[],
): PairScore[] => {
  if (externalPairs) return externalPairs;
  return collectPairs(colors);
};

const collectPairs = (colors: HSL[]): PairScore[] => {
  const pairs: PairScore[] = [];
  for (let outerIndex = 0; outerIndex < colors.length; outerIndex++) {
    for (let innerIndex = outerIndex + 1; innerIndex < colors.length; innerIndex++) {
      pairs.push(pairHarmony(colors[outerIndex], colors[innerIndex]));
    }
  }
  return pairs;
};

const averagePairScore = (pairs: PairScore[]): number => {
  if (pairs.length === 0) return 60;
  let sum = 0;
  for (const pair of pairs) sum += pair.score;
  return sum / pairs.length;
};
