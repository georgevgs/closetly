import { describe, expect, test } from "bun:test";

import { planSeasonSwap, unwornItemIds } from "~/features/closet/seasonSwap";
import { pickAnchorsForToday } from "~/lib/outfit/anchorPicker";
import { hexToHsl } from "~/lib/color/hsl";
import type { Category, Item, Season } from "~/types/items";

const STORED_AT = "2026-04-01T09:00:00Z";

const buildItem = (
  id: string,
  options: { seasons: Season[]; stored?: boolean; category?: Category; createdAt?: string },
): Item => {
  return {
    id,
    user_id: "user-1",
    category: categoryOrBottom(options.category),
    name: id,
    photo_url: "",
    thumb_url: null,
    colors: [{ hex: "#2b1d10", hsl: hexToHsl("#2b1d10") }],
    formality: 3,
    seasons: options.seasons,
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
    storedAt: storedAtFor(options.stored),
    created_at: createdAtOrDefault(options.createdAt),
  };
};

const categoryOrBottom = (category: Category | undefined): Category => {
  if (category === undefined) return "bottom";
  return category;
};

const storedAtFor = (stored: boolean | undefined): string | null => {
  if (stored === true) return STORED_AT;
  return null;
};

const createdAtOrDefault = (createdAt: string | undefined): string => {
  if (createdAt === undefined) return "2026-01-01T00:00:00Z";
  return createdAt;
};

const idsOf = (items: Item[]): string[] => items.map((item) => item.id);

describe("planSeasonSwap", () => {
  test("summer-only pieces in the closet get packed away for autumn", () => {
    const shorts = buildItem("shorts", { seasons: ["summer"] });
    const jeans = buildItem("jeans", { seasons: ["spring", "autumn", "winter"] });

    const plan = planSeasonSwap([shorts, jeans], ["autumn"]);

    expect(idsOf(plan.packAway)).toEqual(["shorts"]);
    expect(plan.bringOut).toEqual([]);
  });

  test("stored pieces that fit the coming season are brought out", () => {
    const trousers = buildItem("trousers", { seasons: ["autumn", "winter"], stored: true });
    const linen = buildItem("linen", { seasons: ["summer"], stored: true });

    const plan = planSeasonSwap([trousers, linen], ["autumn", "winter"]);

    expect(idsOf(plan.bringOut)).toEqual(["trousers"]);
    expect(plan.packAway).toEqual([]);
  });

  test("untagged pieces are never moved", () => {
    const untaggedOut = buildItem("untagged-out", { seasons: [] });
    const untaggedStored = buildItem("untagged-stored", { seasons: [], stored: true });

    const plan = planSeasonSwap([untaggedOut, untaggedStored], ["winter"]);

    expect(plan.packAway).toEqual([]);
    expect(plan.bringOut).toEqual([]);
  });
});

describe("unwornItemIds", () => {
  const now = new Date("2026-10-18T12:00:00Z");

  test("flags pieces owned for a season that were never worn", () => {
    const worn = buildItem("worn", { seasons: ["summer"] });
    const neverWorn = buildItem("never-worn", { seasons: ["summer"] });
    const wearCounts = new Map([["worn", 4]]);

    expect([...unwornItemIds([worn, neverWorn], wearCounts, now)]).toEqual(["never-worn"]);
  });

  test("recent additions are not flagged yet", () => {
    const recent = buildItem("recent", { seasons: ["summer"], createdAt: "2026-09-30T00:00:00Z" });
    const wearCounts = new Map([["something-else", 1]]);

    expect(unwornItemIds([recent], wearCounts, now).size).toBe(0);
  });

  test("users who never log wears get no declutter hints", () => {
    const item = buildItem("item", { seasons: ["summer"] });

    expect(unwornItemIds([item], new Map(), now).size).toBe(0);
  });
});

describe("stored items and today's suggestions", () => {
  test("a stored piece is never offered as an anchor", () => {
    const stored = buildItem("stored-shorts", { seasons: ["summer"], stored: true });
    const active = buildItem("active-jeans", { seasons: ["autumn"] });

    const anchors = pickAnchorsForToday({ closet: [stored, active], count: 2 });

    expect(idsOf(anchors)).toEqual(["active-jeans"]);
  });
});
