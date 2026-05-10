import { getColors, type ImageColorsResult } from "react-native-image-colors";
import type { BgRemoveMaskStats } from "expo-bg-remover";
import { hexToHsl, isLight, isNeutral } from "~/lib/color/hsl";
import type { ItemColor, Silhouette, VisionAttrs } from "~/types/items";

export async function analyzeItemFromUri(uri: string): Promise<VisionAttrs> {
  const result = await getColors(uri, {
    fallback: "#888888",
    cache: false,
    quality: "high",
  });
  const candidates = candidateHexes(result);
  const ranked = rankGarmentColors(candidates);
  return { colors: ranked.map((hex) => ({ hex })) };
}

// Foreground colors come pre-sorted by area from the Vision mask, so they
// don't need the light+neutral penalty that rankGarmentColors applies to
// suppress background leakage.
export function attrsFromMaskedColors(hexes: string[]): VisionAttrs {
  const seen = new Set<string>();
  const out: { hex: string }[] = [];
  for (const hex of hexes) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
    const lower = hex.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push({ hex: lower });
    if (out.length >= 3) break;
  }
  return { colors: out };
}

function candidateHexes(result: ImageColorsResult): string[] {
  if (result.platform === "ios") {
    return [
      result.primary,
      result.detail,
      result.secondary,
      result.background,
    ].filter(isHex);
  }
  return [
    result.vibrant,
    result.muted,
    result.darkMuted,
    result.lightMuted,
    result.darkVibrant,
    result.lightVibrant,
    result.dominant,
  ].filter(isHex);
}

function rankGarmentColors(hexes: string[]): string[] {
  const seen = new Set<string>();
  const ranked: { hex: string; score: number }[] = [];
  for (let i = 0; i < hexes.length; i++) {
    const hex = hexes[i].toLowerCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    const hsl = hexToHsl(hex);
    let score = 100 - i * 5;
    if (isLight(hsl) && isNeutral(hsl)) score -= 30;
    ranked.push({ hex, score });
  }
  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.hex);
}

function isHex(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function visionColorsToItemColors(
  visionColors: VisionAttrs["colors"],
): ItemColor[] {
  return visionColors
    .slice(0, 3)
    .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c.hex))
    .map((c) => ({ hex: c.hex.toLowerCase(), hsl: hexToHsl(c.hex) }));
}

// Coverage of the foreground subject within its bounding box is a coarse
// proxy for fit: a tightly-filled bbox suggests slim/structured pieces;
// lots of empty space inside the bbox suggests draped/oversized shapes.
export function inferSilhouetteFromMask(mask: BgRemoveMaskStats): Silhouette | null {
  if (mask.bboxW <= 0 || mask.bboxH <= 0) return null;
  if (mask.bboxW < 24 || mask.bboxH < 24) return null;
  const fit = fitFromCoverage(mask.coverage);
  return { fit };
}

function fitFromCoverage(coverage: number): Silhouette["fit"] {
  if (coverage >= 0.78) return "slim";
  if (coverage >= 0.65) return "regular";
  if (coverage >= 0.5) return "relaxed";
  return "oversized";
}
