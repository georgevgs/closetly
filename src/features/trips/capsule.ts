import type { Item, Category, Season } from "~/types/items";
import { paletteHarmony } from "~/lib/color/harmony";

export type CapsuleInput = {
  closet: Item[];
  days: number;
  tempMinC: number;
  tempMaxC: number;
  seasons: Season[];
  formality?: { min: number; max: number };
};

export type Capsule = {
  items: Item[];
  byCategory: Record<Category, Item[]>;
  combinations: number;
};

const SLOT_PLAN = (days: number): Partial<Record<Category, number>> => ({
  top: Math.max(2, Math.min(7, Math.ceil(days / 2))),
  bottom: Math.max(1, Math.min(4, Math.ceil(days / 3))),
  outerwear: 1,
  shoes: days >= 4 ? 2 : 1,
  dress: days >= 4 ? 1 : 0,
  bag: 1,
  accessory: Math.min(3, Math.ceil(days / 3)),
  hat: 0,
});

export function buildCapsule(input: CapsuleInput): Capsule {
  const { closet, days, tempMinC, tempMaxC, seasons, formality } = input;

  const targetWarmth = warmthForRange(tempMinC, tempMaxC);

  const candidates = closet.filter((item) => {
    if (item.seasons.length > 0 && !item.seasons.some((s) => seasons.includes(s))) {
      return false;
    }
    if (formality && (item.formality < formality.min || item.formality > formality.max)) {
      return false;
    }
    if (Math.abs(item.warmth - targetWarmth) > 2) return false;
    return true;
  });

  const plan = SLOT_PLAN(days);
  const byCategory: Record<Category, Item[]> = {
    top: [],
    bottom: [],
    dress: [],
    outerwear: [],
    shoes: [],
    bag: [],
    hat: [],
    accessory: [],
  };

  for (const [cat, count] of Object.entries(plan) as [Category, number][]) {
    if (count <= 0) continue;
    const pool = candidates.filter((c) => c.category === cat);
    const others = candidates.filter((c) => c.category !== cat);
    const ranked = pool
      .map((item) => ({ item, score: avgPairScore(item, others) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((x) => x.item);
    byCategory[cat] = ranked;
  }

  const items = Object.values(byCategory).flat();

  const tops = byCategory.top.length;
  const bottoms = byCategory.bottom.length;
  const dresses = byCategory.dress.length;
  const shoes = Math.max(1, byCategory.shoes.length);
  const combinations = (tops * bottoms + dresses) * shoes;

  return { items, byCategory, combinations };
}

function avgPairScore(item: Item, others: Item[]): number {
  if (others.length === 0) return 0;
  let sum = 0;
  for (const other of others) {
    const palette = [
      ...item.colors.slice(0, 2).map((c) => c.hsl),
      ...other.colors.slice(0, 2).map((c) => c.hsl),
    ];
    sum += paletteHarmony(palette).score;
  }
  return sum / others.length;
}

function warmthForRange(min: number, max: number): number {
  const avg = (min + max) / 2;
  if (avg >= 25) return 1;
  if (avg >= 18) return 2;
  if (avg >= 10) return 3;
  if (avg >= 2) return 4;
  return 4;
}
