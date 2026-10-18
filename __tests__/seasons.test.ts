import { describe, expect, test } from "bun:test";

import {
  activeSeasonsFor,
  calendarSeasonFor,
  seasonFeltAt,
  seasonKeyFor,
  seasonsForWarmth,
} from "~/lib/seasons";

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

const LONDON_LATITUDE = 51.5;
const SYDNEY_LATITUDE = -33.9;

describe("calendarSeasonFor", () => {
  test("mid-October is autumn in the northern hemisphere", () => {
    expect(calendarSeasonFor(new Date(2026, 9, 18), LONDON_LATITUDE)).toBe("autumn");
  });

  test("mid-October is spring in the southern hemisphere", () => {
    expect(calendarSeasonFor(new Date(2026, 9, 18), SYDNEY_LATITUDE)).toBe("spring");
  });

  test("an unknown location falls back to the northern hemisphere", () => {
    expect(calendarSeasonFor(new Date(2026, 0, 10), null)).toBe("winter");
  });
});

describe("seasonFeltAt", () => {
  test("a hot day feels like summer", () => {
    expect(seasonFeltAt(24)).toBe("summer");
  });

  test("a cold day feels like winter", () => {
    expect(seasonFeltAt(3)).toBe("winter");
  });

  test("a mild day adds no season of its own", () => {
    expect(seasonFeltAt(14)).toBeNull();
  });
});

describe("activeSeasonsFor", () => {
  test("a mild mid-October keeps only autumn", () => {
    const active = activeSeasonsFor({
      date: new Date(2026, 9, 18),
      latitude: LONDON_LATITUDE,
      tempC: 12,
    });
    expect(active).toEqual(["autumn"]);
  });

  test("late in the season the next one is included early", () => {
    const active = activeSeasonsFor({
      date: new Date(2026, 10, 20),
      latitude: LONDON_LATITUDE,
      tempC: 12,
    });
    expect(active).toEqual(["autumn", "winter"]);
  });

  test("a warm autumn day keeps summer pieces out", () => {
    const active = activeSeasonsFor({
      date: new Date(2026, 8, 10),
      latitude: LONDON_LATITUDE,
      tempC: 24,
    });
    expect(active).toEqual(["summer", "autumn"]);
  });

  test("a cold snap in October brings winter forward", () => {
    const active = activeSeasonsFor({
      date: new Date(2026, 9, 18),
      latitude: LONDON_LATITUDE,
      tempC: 4,
    });
    expect(active).toEqual(["autumn", "winter"]);
  });

  test("without weather only the calendar decides", () => {
    const active = activeSeasonsFor({
      date: new Date(2026, 6, 10),
      latitude: LONDON_LATITUDE,
      tempC: null,
    });
    expect(active).toEqual(["summer"]);
  });
});

describe("seasonKeyFor", () => {
  test("December and the following February share one winter", () => {
    const december = seasonKeyFor(new Date(2026, 11, 15), LONDON_LATITUDE);
    const february = seasonKeyFor(new Date(2027, 1, 15), LONDON_LATITUDE);
    expect(december).toBe("winter-2026");
    expect(february).toBe("winter-2026");
  });

  test("the southern summer spanning new year is one season", () => {
    const december = seasonKeyFor(new Date(2026, 11, 15), SYDNEY_LATITUDE);
    const january = seasonKeyFor(new Date(2027, 0, 15), SYDNEY_LATITUDE);
    expect(december).toBe("summer-2026");
    expect(january).toBe("summer-2026");
  });
});
