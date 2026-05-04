import { getColors, type ImageColorsResult } from "react-native-image-colors";
import { hexToHsl, isLight, isNeutral } from "~/lib/color/hsl";
import type { ItemColor, VisionAttrs } from "~/types/items";

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
