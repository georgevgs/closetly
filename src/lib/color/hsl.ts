export type HSL = { h: number; s: number; l: number };

export function hexToHsl(hex: string): HSL {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const delta = max - min;
    if (l > 0.5) s = delta / (2 - max - min);
    else s = delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta;
        if (g < b) h += 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: HSL): string {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondLargest = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [chroma, secondLargest, 0];
  else if (h < 120) [r, g, b] = [secondLargest, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, secondLargest];
  else if (h < 240) [r, g, b] = [0, secondLargest, chroma];
  else if (h < 300) [r, g, b] = [secondLargest, 0, chroma];
  else [r, g, b] = [chroma, 0, secondLargest];
  const toHex = (channel: number) =>
    Math.round((channel + match) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hueDistance(firstHue: number, secondHue: number): number {
  const distance = Math.abs(firstHue - secondHue) % 360;
  if (distance > 180) return 360 - distance;
  return distance;
}

export function isNeutral({ s, l }: HSL): boolean {
  if (s < 0.12) return true;
  if (l < 0.08) return true;
  if (l > 0.94) return true;
  if (l <= 0.28 && s <= 0.6) return true;
  if (l >= 0.82 && s <= 0.25) return true;
  return false;
}

export function isDark({ l }: HSL): boolean {
  return l < 0.35;
}

export function isLight({ l }: HSL): boolean {
  return l > 0.7;
}

export function isPastel({ s, l }: HSL): boolean {
  return s < 0.5 && l > 0.7;
}

export function isMuted({ s }: HSL): boolean {
  return s < 0.4;
}
