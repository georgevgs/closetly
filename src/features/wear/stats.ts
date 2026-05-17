import type { Item } from "~/types/items";
import type { ItemWearCounts } from "./hooks/useItemWearCounts";

const MOST_WORN_LIMIT = 3;
const NEVER_WORN_SAMPLE_LIMIT = 4;

export type CurrencyTotal = {
  currency: string;
  total: number;
};

export type AverageCostPerWear = {
  currency: string;
  average: number;
};

export type WardrobeStats = {
  totalItems: number;
  valuesByCurrency: CurrencyTotal[];
  averageCostPerWear: AverageCostPerWear[];
  mostWorn: { item: Item; wears: number }[];
  neverWorn: { count: number; sample: Item[] };
};

export const computeWardrobeStats = (
  items: Item[],
  wearCounts: ItemWearCounts,
): WardrobeStats => {
  return {
    totalItems: items.length,
    valuesByCurrency: valuesByCurrencyFor(items),
    averageCostPerWear: averageCostPerWearFor(items, wearCounts),
    mostWorn: mostWornFor(items, wearCounts),
    neverWorn: neverWornFor(items, wearCounts),
  };
};

const valuesByCurrencyFor = (items: Item[]): CurrencyTotal[] => {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.price === null) continue;
    const currency = currencyOrUnknown(item.currency);
    const current = totals.get(currency);
    if (current === undefined) {
      totals.set(currency, item.price);
      continue;
    }
    totals.set(currency, current + item.price);
  }
  return Array.from(totals.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((first, second) => second.total - first.total);
};

const averageCostPerWearFor = (
  items: Item[],
  wearCounts: ItemWearCounts,
): AverageCostPerWear[] => {
  const sums = new Map<string, { totalSpend: number; totalWears: number }>();
  for (const item of items) {
    if (item.price === null) continue;
    const wears = wearCounts.get(item.id);
    if (wears === undefined || wears === 0) continue;
    const currency = currencyOrUnknown(item.currency);
    const bucket = sums.get(currency);
    if (bucket) {
      bucket.totalSpend += item.price;
      bucket.totalWears += wears;
      continue;
    }
    sums.set(currency, { totalSpend: item.price, totalWears: wears });
  }
  return Array.from(sums.entries()).map(([currency, bucket]) => ({
    currency,
    average: bucket.totalSpend / bucket.totalWears,
  }));
};

const mostWornFor = (
  items: Item[],
  wearCounts: ItemWearCounts,
): { item: Item; wears: number }[] => {
  const ranked: { item: Item; wears: number }[] = [];
  for (const item of items) {
    const wears = wearCounts.get(item.id);
    if (wears === undefined || wears === 0) continue;
    ranked.push({ item, wears });
  }
  ranked.sort((first, second) => second.wears - first.wears);
  return ranked.slice(0, MOST_WORN_LIMIT);
};

const neverWornFor = (
  items: Item[],
  wearCounts: ItemWearCounts,
): { count: number; sample: Item[] } => {
  const unworn: Item[] = [];
  for (const item of items) {
    const wears = wearCounts.get(item.id);
    if (wears !== undefined && wears > 0) continue;
    unworn.push(item);
  }
  return { count: unworn.length, sample: unworn.slice(0, NEVER_WORN_SAMPLE_LIMIT) };
};

const currencyOrUnknown = (currency: string | null): string => {
  if (currency === null) return "unspecified";
  return currency;
};
