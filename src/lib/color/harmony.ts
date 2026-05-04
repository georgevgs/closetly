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

export function pairHarmony(a: HSL, b: HSL): PairScore {
  const aNeutral = isNeutral(a);
  const bNeutral = isNeutral(b);

  if (aNeutral && bNeutral) {
    const lDiff = Math.abs(a.l - b.l);
    return { score: 70 + Math.min(lDiff, 0.5) * 60, type: "tonal" };
  }
  if (aNeutral || bNeutral) return { score: 90, type: "neutral-anchor" };

  const dh = hueDistance(a.h, b.h);
  const sAvg = (a.s + b.s) / 2;

  if (dh <= 12) {
    const lDiff = Math.abs(a.l - b.l);
    return { score: 75 + Math.min(lDiff, 0.5) * 50, type: "monochromatic" };
  }
  if (dh <= 35) return { score: 85, type: "analogous" };
  if (dh >= 165) {
    return { score: sAvg > 0.7 ? 70 : 90, type: "complementary" };
  }
  if (dh >= 145 && dh < 165) return { score: 80, type: "split-complementary" };
  if (dh >= 110 && dh < 135) return { score: 72, type: "triadic" };

  const clashPenalty = sAvg > 0.55 ? 35 : 55;
  return { score: clashPenalty, type: "clash" };
}

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

  let pairs: PairScore[];
  if (externalPairs) {
    pairs = externalPairs;
  } else {
    pairs = [];
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        pairs.push(pairHarmony(colors[i], colors[j]));
      }
    }
  }
  const avg =
    pairs.length > 0
      ? pairs.reduce((s, p) => s + p.score, 0) / pairs.length
      : 60;

  const notes: string[] = [];
  let score = avg;

  const chromaCount = colors.filter((c) => !isNeutral(c)).length;
  if (chromaCount > 3) {
    score -= 12;
    notes.push("Too many chromatic colors — keep to ≤3 saturated hues");
  } else if (chromaCount <= 2 && colors.length >= 3) {
    score += 4;
    notes.push("Clean 60-30-10 distribution");
  }

  const hasAnchor = colors.some((c) => isNeutral(c) && (isDark(c) || isLight(c)));
  if (hasAnchor) {
    score += 3;
    notes.push("Neutral anchor present");
  }

  const dark = colors.filter(isDark).length;
  const light = colors.filter(isLight).length;
  if (dark > 0 && light > 0) {
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
