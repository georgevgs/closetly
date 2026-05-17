import { hexToHsl, type HSL } from "./hsl";

export type Swatch = { hex: string; hsl: HSL };

export type ExtractedPalette = {
  primary: Swatch;
  secondary?: Swatch;
  tertiary?: Swatch;
};

const PRESET_HEX = [
  "#ffffff", "#f5f1ea", "#d6c7a8", "#a8835a",
  "#5b3b1f", "#2b1d10", "#000000", "#9ca3af",
  "#3f3f46", "#0f1d3a", "#2e6cd9", "#7fb6ff",
  "#0d6b5e", "#4d6b1f", "#c2b14a", "#e07a3a",
  "#b71f3a", "#5b1530", "#d27c9a", "#5a2c82",
] as const;

export const PRESET_PALETTE: Swatch[] = PRESET_HEX.map((hex) => ({
  hex,
  hsl: hexToHsl(hex),
}));

export function buildPalette(picks: Swatch[]): ExtractedPalette | null {
  if (picks.length === 0) return null;
  return {
    primary: picks[0],
    secondary: picks[1],
    tertiary: picks[2],
  };
}

export function nearestPresetSwatch(hex: string): Swatch {
  const target = hexToRgb(hex);
  let best = PRESET_PALETTE[0];
  let bestDistance = Infinity;
  for (const swatch of PRESET_PALETTE) {
    const rgb = hexToRgb(swatch.hex);
    const distance =
      (target[0] - rgb[0]) ** 2 +
      (target[1] - rgb[1]) ** 2 +
      (target[2] - rgb[2]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = swatch;
    }
  }
  return best;
}

export function snapHexesToPresets(hexes: string[]): Swatch[] {
  const snapped: Swatch[] = [];
  const seen = new Set<string>();
  for (const hex of hexes) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
    const swatch = nearestPresetSwatch(hex);
    if (seen.has(swatch.hex)) continue;
    seen.add(swatch.hex);
    snapped.push(swatch);
    if (snapped.length >= 3) break;
  }
  return snapped;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
