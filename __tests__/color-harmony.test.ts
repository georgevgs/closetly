import { describe, expect, test } from "bun:test";

import { pairHarmony, paletteHarmony } from "~/lib/color/harmony";
import type { HSL } from "~/lib/color/hsl";

const neutralLight: HSL = { h: 0, s: 0.05, l: 0.9 };
const neutralDark: HSL = { h: 0, s: 0.05, l: 0.15 };
const vividBlue: HSL = { h: 220, s: 0.8, l: 0.5 };
const vividOrange: HSL = { h: 30, s: 0.85, l: 0.55 };
const closeBlue: HSL = { h: 225, s: 0.7, l: 0.45 };
const analogousTeal: HSL = { h: 195, s: 0.7, l: 0.5 };

describe("pairHarmony", () => {
  test("two neutrals are tonal", () => {
    expect(pairHarmony(neutralLight, neutralDark).type).toBe("tonal");
  });

  test("one neutral plus one chromatic is a neutral anchor", () => {
    const result = pairHarmony(neutralDark, vividBlue);
    expect(result.type).toBe("neutral-anchor");
    expect(result.score).toBe(90);
  });

  test("hues within 12° are monochromatic", () => {
    expect(pairHarmony(vividBlue, closeBlue).type).toBe("monochromatic");
  });

  test("hues within 35° are analogous", () => {
    expect(pairHarmony(vividBlue, analogousTeal).type).toBe("analogous");
  });

  test("hues at least 165° apart are complementary", () => {
    expect(pairHarmony(vividBlue, vividOrange).type).toBe("complementary");
  });
});

describe("paletteHarmony", () => {
  test("returns a neutral score for fewer than two colors", () => {
    const result = paletteHarmony([vividBlue]);
    expect(result.score).toBe(50);
    expect(result.pairs).toEqual([]);
  });

  test("clamps the score into [0, 100]", () => {
    const result = paletteHarmony([vividBlue, vividOrange, neutralLight]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test("rewards a neutral anchor with light/dark contrast", () => {
    const withAnchor = paletteHarmony([vividBlue, neutralLight, neutralDark]);
    expect(withAnchor.notes).toContain("Neutral anchor present");
    expect(withAnchor.notes).toContain("Light/dark contrast");
  });

  test("penalizes too many chromatic colors", () => {
    const tooManyChromatic = paletteHarmony([
      { h: 0, s: 0.8, l: 0.5 },
      { h: 90, s: 0.8, l: 0.5 },
      { h: 180, s: 0.8, l: 0.5 },
      { h: 270, s: 0.8, l: 0.5 },
    ]);
    expect(tooManyChromatic.notes).toContain(
      "Too many chromatic colors — keep to ≤3 saturated hues",
    );
  });
});
