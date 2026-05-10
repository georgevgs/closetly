import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";

export type WearWeather = {
  tempC: number;
  precipProb: number;
  weatherCode: number;
  summary: string;
};

export type WearEntry = {
  id: string;
  wornOn: string;
  outfitId: string;
  weather: WearWeather | null;
  affinityDelta: number | null;
  itemIds: string[];
};

const DEFAULT_LIMIT = 30;

export function useWearHistory(userId: string | undefined, limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ["wear-log", userId, limit],
    enabled: Boolean(userId),
    queryFn: async (): Promise<WearEntry[]> => {
      if (!userId) return [];

      const wears = await fetchWears(userId, limit);
      if (wears.length === 0) return [];

      const outfitIds = uniqueOutfitIds(wears);
      const links = await fetchOutfitItems(outfitIds);
      const itemsByOutfit = groupItemsByOutfit(links);

      return wears.map((wear) => buildEntry(wear, itemsByOutfit));
    },
  });
}

type WearRow = {
  id: string;
  worn_on: string;
  outfit_id: string;
  weather: unknown;
  affinity_delta: number | null;
};

type OutfitItemRow = { outfit_id: string; item_id: string };

const buildEntry = (wear: WearRow, itemsByOutfit: Map<string, string[]>): WearEntry => {
  const itemIds = itemsByOutfit.get(wear.outfit_id);
  return {
    id: wear.id,
    wornOn: wear.worn_on,
    outfitId: wear.outfit_id,
    weather: parseWeather(wear.weather),
    affinityDelta: wear.affinity_delta,
    itemIds: itemIds === undefined ? [] : itemIds,
  };
};

const fetchWears = async (userId: string, limit: number): Promise<WearRow[]> => {
  const { data, error } = await supabase
    .from("wear_log")
    .select("id, worn_on, outfit_id, weather, affinity_delta")
    .eq("user_id", userId)
    .not("outfit_id", "is", null)
    .order("worn_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!data) return [];

  const usable: WearRow[] = [];
  for (const row of data) {
    if (!row.outfit_id) continue;
    usable.push({
      id: row.id,
      worn_on: row.worn_on,
      outfit_id: row.outfit_id,
      weather: row.weather,
      affinity_delta: row.affinity_delta,
    });
  }
  return usable;
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

const uniqueOutfitIds = (wears: WearRow[]): string[] => {
  const set = new Set<string>();
  for (const wear of wears) set.add(wear.outfit_id);
  return Array.from(set);
};

const groupItemsByOutfit = (links: OutfitItemRow[]): Map<string, string[]> => {
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

const parseWeather = (raw: unknown): WearWeather | null => {
  if (!raw) return null;
  if (typeof raw !== "object") return null;
  const candidate = raw as Partial<WearWeather>;
  if (typeof candidate.tempC !== "number") return null;
  if (typeof candidate.summary !== "string") return null;
  return {
    tempC: candidate.tempC,
    precipProb: numberOrZero(candidate.precipProb),
    weatherCode: numberOrZero(candidate.weatherCode),
    summary: candidate.summary,
  };
};

const numberOrZero = (value: unknown): number => {
  if (typeof value === "number") return value;
  return 0;
};
