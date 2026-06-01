import { describe, expect, test } from "bun:test";

import { pickDiverseOutfits } from "~/lib/outfit/diversity";
import { hexToHsl } from "~/lib/color/hsl";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";
import type { ScoreBreakdown } from "~/lib/outfit/score";
import type { Item, Category } from "~/types/items";

let nextId = 0;

const resolveId = (category: Category, idOverride: string | undefined): string => {
  if (idOverride !== undefined) return idOverride;
  return `${category}-${nextId}`;
};

const buildItem = (category: Category, idOverride?: string): Item => {
  nextId += 1;
  const id = resolveId(category, idOverride);
  return {
    id,
    user_id: "user-1",
    category,
    name: id,
    photo_url: "",
    thumb_url: null,
    colors: [{ hex: "#000000", hsl: hexToHsl("#000000") }],
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

const buildSuggestion = (items: Item[], totalScore: number): OutfitSuggestion => {
  const breakdown: ScoreBreakdown = {
    rawTotal: totalScore,
    total: totalScore,
    color: totalScore,
    proportion: null,
    formality: totalScore,
    style: totalScore,
    pattern: totalScore,
    weather: null,
    balance: null,
    notes: [],
  };
  return { items, score: breakdown };
};

describe("pickDiverseOutfits", () => {
  test("prefers a fresh outfit over one that repeats two items already shown", () => {
    const sharedTop = buildItem("top", "shared-top");
    const sharedBottom = buildItem("bottom", "shared-bottom");
    const shoesA = buildItem("shoes", "shoes-a");
    const shoesB = buildItem("shoes", "shoes-b");
    const otherTop = buildItem("top", "other-top");
    const otherBottom = buildItem("bottom", "other-bottom");
    const otherShoes = buildItem("shoes", "other-shoes");

    const candidates: OutfitSuggestion[] = [
      buildSuggestion([sharedTop, sharedBottom, shoesA], 90),
      buildSuggestion([sharedTop, sharedBottom, shoesB], 88),
      buildSuggestion([otherTop, otherBottom, otherShoes], 80),
    ];

    const picked = pickDiverseOutfits({ candidates, count: 2 });

    expect(picked.length).toBe(2);
    expect(picked[0].items[0].id).toBe("shared-top");
    expect(picked[1].items.some((item) => item.id === "other-top")).toBe(true);
  });

  test("falls back to score order when no diversity penalty applies", () => {
    const topA = buildItem("top", "top-a");
    const bottomA = buildItem("bottom", "bottom-a");
    const shoesA = buildItem("shoes", "shoes-a");
    const topB = buildItem("top", "top-b");
    const bottomB = buildItem("bottom", "bottom-b");
    const shoesB = buildItem("shoes", "shoes-b");

    const candidates: OutfitSuggestion[] = [
      buildSuggestion([topA, bottomA, shoesA], 70),
      buildSuggestion([topB, bottomB, shoesB], 92),
    ];

    const picked = pickDiverseOutfits({ candidates, count: 2 });

    expect(picked[0].items[0].id).toBe("top-b");
    expect(picked[1].items[0].id).toBe("top-a");
  });

  test("returns empty when given no candidates", () => {
    const picked = pickDiverseOutfits({ candidates: [], count: 3 });
    expect(picked).toEqual([]);
  });
});
