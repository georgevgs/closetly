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
  itemCount: number;
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

  const candidates = closet.filter((item) => isCapsuleCandidate(item, {
    seasons,
    formality,
    targetWarmth,
  }));

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

  for (const [category, count] of Object.entries(plan) as [Category, number][]) {
    if (count <= 0) continue;
    const pool = candidates.filter((item) => item.category === category);
    const others = candidates.filter((item) => item.category !== category);
    const ranked = pool
      .map((item) => ({ item, score: avgPairScore(item, others) }))
      .sort((firstEntry, secondEntry) => secondEntry.score - firstEntry.score)
      .slice(0, count)
      .map((entry) => entry.item);
    byCategory[category] = ranked;
  }

  const items = Object.values(byCategory).flat();
  return { items, byCategory, itemCount: items.length };
}

type CapsuleFilterContext = {
  seasons: Season[];
  formality: CapsuleInput["formality"];
  targetWarmth: number;
};

const isCapsuleCandidate = (item: Item, context: CapsuleFilterContext): boolean => {
  if (!matchesSeasons(item, context.seasons)) return false;
  if (!matchesFormality(item, context.formality)) return false;
  if (!matchesWarmth(item.warmth, context.targetWarmth)) return false;
  return true;
};

const matchesSeasons = (item: Item, seasons: Season[]): boolean => {
  if (item.seasons.length === 0) return true;
  return item.seasons.some((season) => seasons.includes(season));
};

const matchesFormality = (
  item: Item,
  formality: CapsuleInput["formality"],
): boolean => {
  if (!formality) return true;
  if (item.formality < formality.min) return false;
  if (item.formality > formality.max) return false;
  return true;
};

// Asymmetric: a warm trip should never include heavy pieces (you can't
// take off a parka), but a cold trip can include lighter pieces because
// they layer underneath. The previous symmetric |diff| > 2 rule failed
// both directions — packing a winter coat for the beach and a t-shirt
// for the alps both passed.
const matchesWarmth = (itemWarmth: number, targetWarmth: number): boolean => {
  if (targetWarmth <= 2) return itemWarmth <= targetWarmth + 1;
  return itemWarmth >= targetWarmth - 2;
};

function avgPairScore(item: Item, others: Item[]): number {
  if (others.length === 0) return 0;
  let sum = 0;
  for (const other of others) {
    const palette = [
      ...item.colors.slice(0, 2).map((color) => color.hsl),
      ...other.colors.slice(0, 2).map((color) => color.hsl),
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
