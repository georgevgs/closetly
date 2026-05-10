import { describe, expect, test } from "bun:test";

import {
  calendarDaysBetween,
  parseDateOnly,
  toDateString,
} from "~/lib/dates";

describe("toDateString", () => {
  test("formats a local date as YYYY-MM-DD with zero-padding", () => {
    const date = new Date(2026, 0, 5);
    expect(toDateString(date)).toBe("2026-01-05");
  });

  test("zero-pads two-digit months and days", () => {
    const date = new Date(2026, 11, 31);
    expect(toDateString(date)).toBe("2026-12-31");
  });
});

describe("parseDateOnly", () => {
  test("parses YYYY-MM-DD anchored at noon local time", () => {
    const parsed = parseDateOnly("2026-03-08");
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(8);
    expect(parsed.getHours()).toBe(12);
  });

  test("round-trips with toDateString", () => {
    const original = "2026-07-04";
    expect(toDateString(parseDateOnly(original))).toBe(original);
  });
});

describe("calendarDaysBetween", () => {
  test("returns 0 for the same calendar day", () => {
    const earlier = new Date(2026, 4, 10, 9);
    const later = new Date(2026, 4, 10, 23);
    expect(calendarDaysBetween(earlier, later)).toBe(0);
  });

  test("counts whole calendar days forward", () => {
    const earlier = new Date(2026, 4, 10);
    const later = new Date(2026, 4, 17);
    expect(calendarDaysBetween(earlier, later)).toBe(7);
  });

  test("returns a negative number when later precedes earlier", () => {
    const earlier = new Date(2026, 4, 17);
    const later = new Date(2026, 4, 10);
    expect(calendarDaysBetween(earlier, later)).toBe(-7);
  });

  test("ignores DST transitions (anchored at noon)", () => {
    const beforeSpringForward = new Date(2026, 2, 7);
    const afterSpringForward = new Date(2026, 2, 9);
    expect(calendarDaysBetween(beforeSpringForward, afterSpringForward)).toBe(2);
  });
});
