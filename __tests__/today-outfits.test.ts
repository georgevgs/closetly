import { describe, expect, test } from "bun:test";

import { suggestTodayOutfits } from "~/lib/outfit/today";
import { hexToHsl } from "~/lib/color/hsl";
import type { Item, Category } from "~/types/items";

// The orchestration glues anchor pick, combinator, scoring, daily seed and
// diversity rerank together. The contract worth pinning here is: the seed is
// derived from the calendar date, so re-asking on the same day returns the
// same outfits, but a different day produces a different selection.

let nextId = 0;

const buildItem = (category: Category, hex: string): Item => {
  nextId += 1;
  return {
    id: `${category}-${nextId}`,
    user_id: "user-1",
    category,
    name: null,
    photo_url: "",
    thumb_url: null,
    colors: [{ hex, hsl: hexToHsl(hex) }],
    formality: 3,
    seasons: [],
    styles: [],
    warmth: 2,
    pattern: "solid",
    silhouette: null,
    brand: null,
    notes: null,
    occasions: [],
    price: null,
    currency: null,
    purchasedOn: null,
    timesWashed: 0,
    inWash: false,
    created_at: "2026-01-01T00:00:00Z",
  };
};

const buildCloset = (): Item[] => {
  return [
    buildItem("bottom", "#2b1d10"),
    buildItem("bottom", "#1a1a1a"),
    buildItem("bottom", "#3b2a18"),
    buildItem("bottom", "#0f0f0f"),
    buildItem("top", "#ffffff"),
    buildItem("top", "#f4f0ea"),
    buildItem("top", "#e8e4dd"),
    buildItem("top", "#dcd6cc"),
    buildItem("shoes", "#000000"),
    buildItem("shoes", "#222222"),
    buildItem("shoes", "#333333"),
  ];
};

const signatureOf = (suggestion: { items: Item[] }): string => {
  return suggestion.items.map((item) => item.id).sort().join("|");
};

const orderedSignatures = (
  suggestions: { items: Item[] }[],
): string[] => {
  return suggestions.map(signatureOf);
};

describe("suggestTodayOutfits orchestration", () => {
  test("the same date produces the same outfits across calls", () => {
    const closet = buildCloset();
    const day = new Date("2026-06-01T12:00:00Z");

    const first = suggestTodayOutfits({ closet, now: day, count: 3 });
    const second = suggestTodayOutfits({ closet, now: day, count: 3 });

    expect(first.length).toBeGreaterThan(0);
    expect(orderedSignatures(first)).toEqual(orderedSignatures(second));
  });

  test("a different date shifts the selection", () => {
    const closet = buildCloset();
    const dayOne = new Date("2026-06-01T12:00:00Z");
    const dayTwo = new Date("2026-09-15T12:00:00Z");

    const first = suggestTodayOutfits({ closet, now: dayOne, count: 3 });
    const second = suggestTodayOutfits({ closet, now: dayTwo, count: 3 });

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    expect(orderedSignatures(first)).not.toEqual(orderedSignatures(second));
  });

  test("respects the requested count when the pool is large enough", () => {
    const closet = buildCloset();
    const day = new Date("2026-06-01T12:00:00Z");

    const picked = suggestTodayOutfits({ closet, now: day, count: 2 });

    expect(picked.length).toBe(2);
  });

  test("returns an empty list when no anchor candidates are available", () => {
    const closet = [
      buildItem("hat", "#000000"),
      buildItem("shoes", "#111111"),
    ];
    const day = new Date("2026-06-01T12:00:00Z");

    const picked = suggestTodayOutfits({ closet, now: day, count: 3 });

    expect(picked).toEqual([]);
  });
});
