import { describe, expect, test } from "bun:test";

import {
  RECENCY,
  coreWardrobeBonusFor,
  recencyPenaltyForDaysAgo,
} from "~/features/outfits/tuning";

describe("recencyPenaltyForDaysAgo", () => {
  test("worn today returns the initial penalty", () => {
    expect(recencyPenaltyForDaysAgo(0)).toBeCloseTo(RECENCY.initialPenalty, 4);
  });

  test("decays monotonically with days", () => {
    const oneDayAgo = recencyPenaltyForDaysAgo(1);
    const sevenDaysAgo = recencyPenaltyForDaysAgo(7);
    const fourteenDaysAgo = recencyPenaltyForDaysAgo(14);
    expect(oneDayAgo).toBeLessThan(RECENCY.initialPenalty);
    expect(sevenDaysAgo).toBeLessThan(oneDayAgo);
    expect(fourteenDaysAgo).toBeLessThan(sevenDaysAgo);
  });

  test("half-life at 7 days yields roughly half the initial penalty", () => {
    const sevenDaysAgo = recencyPenaltyForDaysAgo(7);
    expect(sevenDaysAgo).toBeGreaterThan(RECENCY.initialPenalty * 0.4);
    expect(sevenDaysAgo).toBeLessThan(RECENCY.initialPenalty * 0.6);
  });

  test("returns zero past the 60-day window", () => {
    expect(recencyPenaltyForDaysAgo(60)).toBe(0);
    expect(recencyPenaltyForDaysAgo(100)).toBe(0);
  });

  test("rejects negative input", () => {
    expect(recencyPenaltyForDaysAgo(-3)).toBe(0);
  });
});

describe("coreWardrobeBonusFor", () => {
  test("zero or negative wear count yields no bonus", () => {
    expect(coreWardrobeBonusFor(0)).toBe(0);
    expect(coreWardrobeBonusFor(-1)).toBe(0);
  });

  test("bonus grows with wear count but is capped per item", () => {
    const one = coreWardrobeBonusFor(1);
    const ten = coreWardrobeBonusFor(10);
    const hundred = coreWardrobeBonusFor(100);
    expect(one).toBeGreaterThan(0);
    expect(ten).toBeGreaterThan(one);
    expect(hundred).toBeLessThanOrEqual(3);
  });

  test("at 100 wears the bonus saturates near the cap", () => {
    expect(coreWardrobeBonusFor(100)).toBeGreaterThanOrEqual(2.5);
  });
});
