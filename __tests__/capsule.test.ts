import { describe, expect, test } from "bun:test";

import { buildCapsule } from "~/features/trips/capsule";
import { hexToHsl } from "~/lib/color/hsl";
import type {
  Item,
  Category,
  Style,
  Season,
  Pattern,
  Formality,
  Warmth,
  Occasion,
} from "~/types/items";

let nextId = 0;
const fakeId = (): string => {
  nextId += 1;
  return `item-${nextId}`;
};

type ItemOverrides = Partial<{
  category: Category;
  styles: Style[];
  seasons: Season[];
  pattern: Pattern;
  formality: Formality;
  warmth: Warmth;
  hex: string;
  occasions: Occasion[];
  name: string;
}>;

const buildItem = (overrides: ItemOverrides = {}): Item => {
  const hex = overrides.hex ?? "#3b5b8c";
  return {
    id: fakeId(),
    user_id: "user-test",
    category: overrides.category ?? "top",
    name: overrides.name ?? null,
    photo_url: "photo.jpg",
    thumb_url: null,
    colors: [{ hex, hsl: hexToHsl(hex) }],
    formality: overrides.formality ?? 3,
    seasons: overrides.seasons ?? ["spring", "summer", "autumn"],
    styles: overrides.styles ?? ["minimal", "classic"],
    warmth: overrides.warmth ?? 2,
    pattern: overrides.pattern ?? "solid",
    silhouette: null,
    brand: null,
    notes: null,
    occasions: overrides.occasions ?? [],
    price: null,
    currency: null,
    purchasedOn: null,
    timesWashed: 0,
    created_at: "2026-05-10T00:00:00Z",
  };
};

describe("buildCapsule", () => {
  test("empty closet returns an empty capsule", () => {
    const capsule = buildCapsule({
      closet: [],
      days: 5,
      tempMinC: 12,
      tempMaxC: 22,
      seasons: ["spring", "autumn"],
    });
    expect(capsule.itemCount).toBe(0);
    expect(capsule.items).toEqual([]);
  });

  test("respects per-category slot budget", () => {
    const closet = [
      ...Array.from({ length: 6 }, () => buildItem({ category: "top" })),
      ...Array.from({ length: 4 }, () => buildItem({ category: "bottom" })),
      ...Array.from({ length: 3 }, () => buildItem({ category: "shoes" })),
    ];
    const capsule = buildCapsule({
      closet,
      days: 5,
      tempMinC: 12,
      tempMaxC: 22,
      seasons: ["spring", "autumn"],
    });
    // For 5 days: tops cap = ceil(5/2) = 3, bottoms = ceil(5/3) = 2, shoes = 2.
    expect(capsule.byCategory.top.length).toBeLessThanOrEqual(3);
    expect(capsule.byCategory.bottom.length).toBeLessThanOrEqual(2);
    expect(capsule.byCategory.shoes.length).toBeLessThanOrEqual(2);
  });

  test("rejects parkas on a warm trip", () => {
    const closet = [
      buildItem({ category: "top", warmth: 2, name: "tee" }),
      buildItem({ category: "top", warmth: 4, name: "parka-top" }),
      buildItem({ category: "bottom", warmth: 2 }),
      buildItem({ category: "shoes", warmth: 2 }),
    ];
    const capsule = buildCapsule({
      closet,
      days: 5,
      tempMinC: 26,
      tempMaxC: 32,
      seasons: ["summer"],
    });
    const tops = capsule.byCategory.top.map((item) => item.name);
    expect(tops).not.toContain("parka-top");
  });

  test("allows a light layer on a cold trip (asymmetric)", () => {
    const closet = [
      buildItem({ category: "top", warmth: 2, name: "tee", seasons: ["winter"] }),
      buildItem({ category: "top", warmth: 4, seasons: ["winter"] }),
      buildItem({ category: "bottom", warmth: 3, seasons: ["winter"] }),
      buildItem({ category: "shoes", warmth: 3, seasons: ["winter"] }),
    ];
    const capsule = buildCapsule({
      closet,
      days: 5,
      tempMinC: -2,
      tempMaxC: 4,
      seasons: ["winter"],
    });
    const tops = capsule.byCategory.top.map((item) => item.name);
    // tee (warmth 2) is target - 2 = 4 - 2 = 2 → keep.
    expect(tops).toContain("tee");
  });

  test("surfaces an item that participates in many high-scoring outfits", () => {
    // Workhorse top: neutral, classic — pairs well with anything.
    // The other top is a clashy bright orange that drags scores down.
    const workhorse = buildItem({
      category: "top",
      hex: "#1f2933",
      name: "workhorse",
      styles: ["minimal", "classic"],
    });
    const clashy = buildItem({
      category: "top",
      hex: "#ff5a1f",
      name: "clashy",
      styles: ["streetwear"],
      pattern: "graphic",
    });
    const closet = [
      workhorse,
      clashy,
      buildItem({ category: "bottom", hex: "#2c2a2a", styles: ["minimal"] }),
      buildItem({ category: "bottom", hex: "#3b5b8c", styles: ["classic"] }),
      buildItem({ category: "shoes", hex: "#1a1a1a", styles: ["minimal"] }),
      buildItem({ category: "shoes", hex: "#dad6cf", styles: ["classic"] }),
    ];
    const capsule = buildCapsule({
      closet,
      days: 3,
      tempMinC: 18,
      tempMaxC: 24,
      seasons: ["spring", "summer"],
    });
    const tops = capsule.byCategory.top.map((item) => item.name);
    // 3-day plan picks 2 tops; workhorse must be one of them.
    expect(tops).toContain("workhorse");
  });
});
