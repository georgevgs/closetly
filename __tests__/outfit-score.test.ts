import { describe, expect, test } from "bun:test";

import { scoreOutfit } from "~/lib/outfit/score";
import { hexToHsl } from "~/lib/color/hsl";
import type { Item, Category, Pattern, Silhouette, Style } from "~/types/items";

// Minimal Item factory — every test field maps to a real Item field. We keep
// silhouette null and styles empty so individual tests can opt into those
// signals without inheriting them from a shared default.
type ItemOverrides = {
  category: Category;
  hexes: string[];
  pattern?: Pattern;
  formality?: 1 | 2 | 3 | 4 | 5;
  warmth?: 0 | 1 | 2 | 3 | 4;
  silhouette?: Silhouette;
  styles?: Style[];
  id?: string;
};

let nextId = 0;

const buildItem = (overrides: ItemOverrides): Item => {
  nextId += 1;
  return {
    id: overrides.id ?? `item-${nextId}`,
    user_id: "user-1",
    category: overrides.category,
    name: null,
    photo_url: "",
    thumb_url: null,
    colors: overrides.hexes.map((hex) => ({ hex, hsl: hexToHsl(hex) })),
    formality: overrides.formality ?? 3,
    seasons: [],
    styles: overrides.styles ?? [],
    warmth: overrides.warmth ?? 2,
    pattern: overrides.pattern ?? "solid",
    silhouette: overrides.silhouette ?? null,
    brand: null,
    notes: null,
    occasions: [],
    price: null,
    currency: null,
    purchasedOn: null,
    timesWashed: 0,
    created_at: "2026-01-01T00:00:00Z",
  };
};

describe("proportion (60-30-10) scoring", () => {
  test("all-neutral outfit is graded but not penalized harshly", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#ffffff"] }),
      buildItem({ category: "bottom", hexes: ["#2b1d10"] }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);
    expect(result.proportion).not.toBeNull();
    expect(result.proportion!).toBeGreaterThanOrEqual(70);
    expect(result.notes).toContain("All-neutral palette");
  });

  test("single chromatic accent piece scores highest", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#ffffff"] }),
      buildItem({ category: "bottom", hexes: ["#2b1d10"] }),
      buildItem({ category: "shoes", hexes: ["#b71f3a"] }), // red accent
    ]);
    expect(result.proportion!).toBeGreaterThanOrEqual(90);
  });

  test("three competing chromatic pieces with no neutral anchor drops the score", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#b71f3a"] }), // vivid red
      buildItem({ category: "bottom", hexes: ["#2e6cd9"] }), // vivid blue
      buildItem({ category: "shoes", hexes: ["#c2b14a"] }), // saturated yellow (stays chromatic)
    ]);
    expect(result.proportion!).toBeLessThanOrEqual(70);
    expect(result.notes.some((note) => note.includes("competing") || note.includes("ground"))).toBe(
      true,
    );
  });

  test("two chromatic items with a neutral anchor still scores well", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#b71f3a"] }),
      buildItem({ category: "bottom", hexes: ["#000000"] }),
      buildItem({ category: "shoes", hexes: ["#2e6cd9"] }),
    ]);
    expect(result.proportion!).toBeGreaterThanOrEqual(70);
  });
});

describe("pattern mixing", () => {
  test("a single patterned piece is always fine", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#ffffff"], pattern: "striped" }),
      buildItem({ category: "bottom", hexes: ["#2b1d10"] }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);
    expect(result.pattern).toBe(100);
  });

  test("two patterned pieces on accessories are allowed", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#ffffff"] }),
      buildItem({ category: "bottom", hexes: ["#2b1d10"] }),
      buildItem({ category: "shoes", hexes: ["#b71f3a"], pattern: "graphic" }),
      buildItem({ category: "bag", hexes: ["#b71f3a"], pattern: "animal" }),
    ]);
    expect(result.pattern).toBeGreaterThanOrEqual(70);
    expect(result.notes.some((note) => note.includes("accent"))).toBe(true);
  });

  test("two patterned pieces sharing a color family are allowed", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#b71f3a"], pattern: "floral" }),
      buildItem({ category: "bottom", hexes: ["#5b1530"], pattern: "striped" }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);
    expect(result.pattern).toBeGreaterThanOrEqual(70);
    expect(result.notes.some((note) => note.includes("sharing"))).toBe(true);
  });

  test("two patterned pieces in unrelated colors are still flagged", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#b71f3a"], pattern: "floral" }),
      buildItem({ category: "bottom", hexes: ["#2e6cd9"], pattern: "striped" }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);
    expect(result.pattern).toBeLessThanOrEqual(60);
  });

  test("three patterned pieces is always penalized", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#ffffff"], pattern: "striped" }),
      buildItem({ category: "bottom", hexes: ["#2b1d10"], pattern: "plaid" }),
      buildItem({ category: "shoes", hexes: ["#b71f3a"], pattern: "animal" }),
    ]);
    expect(result.pattern).toBeLessThanOrEqual(40);
  });
});

describe("length-aware balance", () => {
  test("cropped top with relaxed bottom outscores both-regular", () => {
    const croppedAndRelaxed = scoreOutfit([
      buildItem({
        category: "top",
        hexes: ["#ffffff"],
        silhouette: { fit: "regular", length: "cropped" },
      }),
      buildItem({
        category: "bottom",
        hexes: ["#2b1d10"],
        silhouette: { fit: "relaxed", length: "regular" },
      }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);

    const bothRegular = scoreOutfit([
      buildItem({
        category: "top",
        hexes: ["#ffffff"],
        silhouette: { fit: "regular", length: "regular" },
      }),
      buildItem({
        category: "bottom",
        hexes: ["#2b1d10"],
        silhouette: { fit: "relaxed", length: "regular" },
      }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);

    expect(croppedAndRelaxed.balance!).toBeGreaterThan(bothRegular.balance!);
  });

  test("both-long stack is gently nudged down", () => {
    const result = scoreOutfit([
      buildItem({
        category: "top",
        hexes: ["#ffffff"],
        silhouette: { fit: "regular", length: "long" },
      }),
      buildItem({
        category: "bottom",
        hexes: ["#2b1d10"],
        silhouette: { fit: "regular", length: "long" },
      }),
      buildItem({ category: "shoes", hexes: ["#000000"] }),
    ]);
    expect(result.notes.some((note) => note.includes("full-length"))).toBe(true);
  });
});

describe("user style preference bonus", () => {
  test("matching-style outfit outscores the same outfit with no preferences", () => {
    const minimal = new Set<Style>(["minimal"]);

    const withPreferences = scoreOutfit(
      [
        buildItem({
          id: "p1",
          category: "top",
          hexes: ["#ffffff"],
          styles: ["minimal"],
        }),
        buildItem({
          id: "p2",
          category: "bottom",
          hexes: ["#2b1d10"],
          styles: ["minimal"],
        }),
        buildItem({
          id: "p3",
          category: "shoes",
          hexes: ["#000000"],
          styles: ["minimal"],
        }),
      ],
      { preferredStyles: minimal },
    );

    const noPreferences = scoreOutfit([
      buildItem({
        id: "p1",
        category: "top",
        hexes: ["#ffffff"],
        styles: ["minimal"],
      }),
      buildItem({
        id: "p2",
        category: "bottom",
        hexes: ["#2b1d10"],
        styles: ["minimal"],
      }),
      buildItem({
        id: "p3",
        category: "shoes",
        hexes: ["#000000"],
        styles: ["minimal"],
      }),
    ]);

    expect(withPreferences.total).toBeGreaterThan(noPreferences.total);
  });

  test("the preference bonus is bounded so it can't dominate scoring", () => {
    const minimal = new Set<Style>(["minimal"]);
    const result = scoreOutfit(
      Array.from({ length: 6 }, (_, index) =>
        buildItem({
          id: `bulk-${index}`,
          category: "accessory",
          hexes: ["#ffffff"],
          styles: ["minimal"],
        }),
      ),
      { preferredStyles: minimal },
    );
    expect(result.total).toBeLessThanOrEqual(100);
  });
});

describe("core wardrobe bonus", () => {
  test("frequently-worn items lift the overall score above the same items at zero wears", () => {
    const heavyItems = [
      buildItem({ id: "h1", category: "top", hexes: ["#ffffff"] }),
      buildItem({ id: "h2", category: "bottom", hexes: ["#2b1d10"] }),
      buildItem({ id: "h3", category: "shoes", hexes: ["#000000"] }),
    ];
    const heavyCounts = new Map([
      ["h1", 30],
      ["h2", 25],
      ["h3", 20],
    ]);

    const withHistory = scoreOutfit(heavyItems, { itemWearCounts: heavyCounts });
    const noHistory = scoreOutfit(heavyItems);

    expect(withHistory.total).toBeGreaterThan(noHistory.total);
    expect(withHistory.total).toBeLessThanOrEqual(100);
  });
});

describe("clamps and shape", () => {
  test("returns null for empty outfit components but never crashes", () => {
    const result = scoreOutfit([]);
    expect(result.total).toBe(0);
    expect(result.proportion).toBeNull();
    expect(result.weather).toBeNull();
    expect(result.balance).toBeNull();
  });

  test("total stays within 0-100 even with many chromatic items", () => {
    const result = scoreOutfit([
      buildItem({ category: "top", hexes: ["#b71f3a"] }),
      buildItem({ category: "bottom", hexes: ["#2e6cd9"] }),
      buildItem({ category: "outerwear", hexes: ["#4d6b1f"] }),
      buildItem({ category: "shoes", hexes: ["#c2b14a"] }),
    ]);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
  });
});
