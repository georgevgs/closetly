import { describe, expect, test } from "bun:test";

import {
  hexToHsl,
  hslToHex,
  hueDistance,
  isDark,
  isLight,
  isMuted,
  isNeutral,
  isPastel,
} from "~/lib/color/hsl";

describe("hexToHsl", () => {
  test("converts pure black", () => {
    const black = hexToHsl("#000000");
    expect(black.s).toBe(0);
    expect(black.l).toBe(0);
  });

  test("converts pure white", () => {
    const white = hexToHsl("#ffffff");
    expect(white.s).toBe(0);
    expect(white.l).toBe(1);
  });

  test("converts pure red to hue 0", () => {
    const red = hexToHsl("#ff0000");
    expect(red.h).toBe(0);
    expect(red.s).toBe(1);
    expect(red.l).toBeCloseTo(0.5, 5);
  });

  test("converts pure green to hue 120", () => {
    const green = hexToHsl("#00ff00");
    expect(green.h).toBeCloseTo(120, 5);
  });

  test("converts pure blue to hue 240", () => {
    const blue = hexToHsl("#0000ff");
    expect(blue.h).toBeCloseTo(240, 5);
  });

  test("accepts hex with leading hash stripped", () => {
    expect(hexToHsl("#ff0000")).toEqual(hexToHsl("ff0000"));
  });
});

describe("hslToHex", () => {
  test("round-trips primaries through HSL", () => {
    expect(hslToHex(hexToHsl("#ff0000"))).toBe("#ff0000");
    expect(hslToHex(hexToHsl("#00ff00"))).toBe("#00ff00");
    expect(hslToHex(hexToHsl("#0000ff"))).toBe("#0000ff");
  });

  test("round-trips black and white", () => {
    expect(hslToHex(hexToHsl("#000000"))).toBe("#000000");
    expect(hslToHex(hexToHsl("#ffffff"))).toBe("#ffffff");
  });
});

describe("hueDistance", () => {
  test("returns 0 for equal hues", () => {
    expect(hueDistance(42, 42)).toBe(0);
  });

  test("wraps around the 360° boundary", () => {
    expect(hueDistance(10, 350)).toBe(20);
  });

  test("caps at 180° for opposite hues", () => {
    expect(hueDistance(0, 180)).toBe(180);
  });
});

describe("color classifiers", () => {
  test("isNeutral catches very low saturation", () => {
    expect(isNeutral({ h: 0, s: 0.05, l: 0.5 })).toBe(true);
  });

  test("isNeutral catches near-black and near-white", () => {
    expect(isNeutral({ h: 0, s: 0.5, l: 0.05 })).toBe(true);
    expect(isNeutral({ h: 0, s: 0.1, l: 0.96 })).toBe(true);
  });

  test("isNeutral rejects vivid mid-tone colors", () => {
    expect(isNeutral({ h: 200, s: 0.8, l: 0.5 })).toBe(false);
  });

  test("isDark, isLight, and isPastel partition by lightness", () => {
    expect(isDark({ h: 0, s: 0, l: 0.2 })).toBe(true);
    expect(isLight({ h: 0, s: 0, l: 0.8 })).toBe(true);
    expect(isPastel({ h: 0, s: 0.3, l: 0.85 })).toBe(true);
    expect(isPastel({ h: 0, s: 0.9, l: 0.85 })).toBe(false);
  });

  test("isMuted reflects low saturation", () => {
    expect(isMuted({ h: 0, s: 0.2, l: 0.5 })).toBe(true);
    expect(isMuted({ h: 0, s: 0.6, l: 0.5 })).toBe(false);
  });
});
