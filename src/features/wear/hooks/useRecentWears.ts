import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { calendarDaysBetween, parseDateOnly, toDateString } from "~/lib/dates";
import { RECENCY } from "~/features/outfits/tuning";

// itemId → minimum daysAgo across all recent wears (0 = worn today).
export type RecentWearMap = Map<string, number>;

export function useRecentWears(userId: string | undefined) {
  return useQuery({
    queryKey: ["recent-wears", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<RecentWearMap> => {
      if (!userId) return new Map();

      const today = new Date();
      const cutoff = subtractDays(today, RECENCY.windowDays);

      const wears = await fetchRecentWears(userId, cutoff);
      if (wears.length === 0) return new Map();

      const daysAgoByOutfit = buildDaysAgoByOutfit(wears, today);
      const outfitIds = Array.from(daysAgoByOutfit.keys());

      const links = await fetchOutfitItems(outfitIds);
      return buildDaysAgoByItem(links, daysAgoByOutfit);
    },
  });
}

type WearRow = { worn_on: string; outfit_id: string | null };
type OutfitItemRow = { outfit_id: string; item_id: string };

const fetchRecentWears = async (userId: string, cutoff: Date): Promise<WearRow[]> => {
  const { data, error } = await supabase
    .from("wear_log")
    .select("worn_on, outfit_id")
    .eq("user_id", userId)
    .gte("worn_on", toDateString(cutoff))
    .not("outfit_id", "is", null);
  if (error) throw error;
  if (!data) return [];
  return data;
};

const fetchOutfitItems = async (outfitIds: string[]): Promise<OutfitItemRow[]> => {
  if (outfitIds.length === 0) return [];
  const { data, error } = await supabase
    .from("outfit_items")
    .select("outfit_id, item_id")
    .in("outfit_id", outfitIds);
  if (error) throw error;
  if (!data) return [];
  return data;
};

const buildDaysAgoByOutfit = (wears: WearRow[], today: Date): Map<string, number> => {
  const byOutfit = new Map<string, number>();
  for (const wear of wears) {
    if (!wear.outfit_id) continue;
    const daysAgo = calendarDaysBetween(parseDateOnly(wear.worn_on), today);
    keepSmallest(byOutfit, wear.outfit_id, daysAgo);
  }
  return byOutfit;
};

const buildDaysAgoByItem = (
  links: OutfitItemRow[],
  daysAgoByOutfit: Map<string, number>,
): RecentWearMap => {
  const byItem: RecentWearMap = new Map();
  for (const link of links) {
    const daysAgo = daysAgoByOutfit.get(link.outfit_id);
    if (daysAgo === undefined) continue;
    keepSmallest(byItem, link.item_id, daysAgo);
  }
  return byItem;
};

const keepSmallest = (map: Map<string, number>, key: string, candidate: number): void => {
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, candidate);
    return;
  }
  if (candidate < existing) map.set(key, candidate);
};

const subtractDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};
