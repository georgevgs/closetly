import { describe, expect, test } from "bun:test";

import { seasonsForWarmth } from "~/lib/seasons";

describe("seasonsForWarmth", () => {
  test("warmth 0 (bare) maps to summer only", () => {
    expect(seasonsForWarmth(0)).toEqual(["summer"]);
  });

  test("warmth 1 maps to spring and summer", () => {
    expect(seasonsForWarmth(1)).toEqual(["spring", "summer"]);
  });

  test("warmth 2 maps to spring, summer, and autumn", () => {
    expect(seasonsForWarmth(2)).toEqual(["spring", "summer", "autumn"]);
  });

  test("warmth 3 maps to autumn and winter", () => {
    expect(seasonsForWarmth(3)).toEqual(["autumn", "winter"]);
  });

  test("warmth 4 (parka) maps to winter only", () => {
    expect(seasonsForWarmth(4)).toEqual(["winter"]);
  });
});
