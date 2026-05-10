import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

export type ItemWearCounts = Map<string, number>;

// Single-user, single-device dataset stays small enough that fetching every
// wear and folding into a Map client-side is cheaper than building a
// dedicated SQL view with RLS workarounds.
export const useItemWearCounts = (userId: string | undefined) => {
  return useQuery<ItemWearCounts>({
    queryKey: ["item-wear-counts", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return new Map();

      const wears = await fetchAllWears(userId);
      if (wears.length === 0) return new Map();

      const outfitIds = uniqueOutfitIds(wears);
      const links = await fetchOutfitItems(outfitIds);
      return buildCounts(wears, links);
    },
  });
};

type WearRow = { outfit_id: string };
type LinkRow = { outfit_id: string; item_id: string };

const fetchAllWears = async (userId: string): Promise<WearRow[]> => {
  const { data, error } = await supabase
    .from("wear_log")
    .select("outfit_id")
    .eq("user_id", userId)
    .not("outfit_id", "is", null);
  if (error) throw error;
  if (!data) return [];
  const usable: WearRow[] = [];
  for (const row of data) {
    if (!row.outfit_id) continue;
    usable.push({ outfit_id: row.outfit_id });
  }
  return usable;
};

const fetchOutfitItems = async (outfitIds: string[]): Promise<LinkRow[]> => {
  if (outfitIds.length === 0) return [];
  const { data, error } = await supabase
    .from("outfit_items")
    .select("outfit_id, item_id")
    .in("outfit_id", outfitIds);
  if (error) throw error;
  if (!data) return [];
  return data;
};

const uniqueOutfitIds = (wears: WearRow[]): string[] => {
  const set = new Set<string>();
  for (const wear of wears) set.add(wear.outfit_id);
  return Array.from(set);
};

const buildCounts = (wears: WearRow[], links: LinkRow[]): ItemWearCounts => {
  const itemsByOutfit = groupItemsByOutfit(links);
  const counts: ItemWearCounts = new Map();
  for (const wear of wears) {
    const itemIds = itemsByOutfit.get(wear.outfit_id);
    if (!itemIds) continue;
    for (const itemId of itemIds) bumpCount(counts, itemId);
  }
  return counts;
};

const groupItemsByOutfit = (links: LinkRow[]): Map<string, string[]> => {
  const byOutfit = new Map<string, string[]>();
  for (const link of links) {
    const existing = byOutfit.get(link.outfit_id);
    if (existing) {
      existing.push(link.item_id);
      continue;
    }
    byOutfit.set(link.outfit_id, [link.item_id]);
  }
  return byOutfit;
};

const bumpCount = (counts: ItemWearCounts, key: string): void => {
  const current = counts.get(key);
  if (current === undefined) {
    counts.set(key, 1);
    return;
  }
  counts.set(key, current + 1);
};
