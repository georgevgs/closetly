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
