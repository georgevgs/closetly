import { describe, expect, test } from "bun:test";

import { pickAnchorsForToday } from "~/lib/outfit/anchorPicker";
import { hexToHsl } from "~/lib/color/hsl";
import type { Item } from "~/types/items";

let nextId = 0;

const buildBottom = (idOverride?: string): Item => {
  nextId += 1;
  const id = idOverride ?? `bottom-${nextId}`;
  return {
    id,
    user_id: "user-1",
    category: "bottom",
    name: id,
    photo_url: "",
    thumb_url: null,
    colors: [{ hex: "#2b1d10", hsl: hexToHsl("#2b1d10") }],
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
    created_at: "2026-01-01T00:00:00Z",
  };
};

describe("anchor picker rediscovery", () => {
  test("an item out of the recent rotation is preferred over a worn-today item", () => {
    const rotated = buildBottom("rotated");
    const fresh = buildBottom("fresh");

    const ranked = pickAnchorsForToday({
      closet: [rotated, fresh],
      recentlyWornItemIds: new Map([["rotated", 0]]),
      count: 2,
    });

    expect(ranked[0].id).toBe("fresh");
    expect(ranked[1].id).toBe("rotated");
  });

  test("with no wear log, ordering is stable regardless of which item is first", () => {
    const first = buildBottom("first");
    const second = buildBottom("second");

    const ranked = pickAnchorsForToday({
      closet: [first, second],
      count: 2,
    });

    expect(ranked.length).toBe(2);
  });

  test("rediscovery bonus does not push an out-of-season anchor over a seasonal one", () => {
    const summer = buildBottom("summer-piece");
    summer.seasons = ["summer"];
    summer.warmth = 0;

    const winter = buildBottom("winter-piece");
    winter.seasons = ["winter"];
    winter.warmth = 4;

    const ranked = pickAnchorsForToday({
      closet: [summer, winter],
      weather: { tempC: 28, precip: false },
      // winter piece is out of rotation, but summer piece should still win
      recentlyWornItemIds: new Map([["summer-piece", 5]]),
      count: 2,
    });

    expect(ranked[0].id).toBe("summer-piece");
  });
});
