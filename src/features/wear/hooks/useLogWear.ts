import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { toDateString } from "~/lib/dates";
import type { Item } from "~/types/items";
import type { WeatherSnapshot } from "~/features/weather/useWeather";
import { requireUserId } from "~/features/auth/requireUserId";
import { bumpPairAffinity } from "~/features/outfits/affinity";
import { PAIR_AFFINITY } from "~/features/outfits/tuning";

export type LogWearInput = {
  items: Item[];
  outfitId?: string;
  weather?: WeatherSnapshot | null;
  wornOn?: Date;
};

export type LogWearResult = {
  outfitId: string;
  wearLogId: string;
};

export function useLogWear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogWearInput): Promise<LogWearResult> => {
      const userId = await requireUserId();

      const outfitId = await ensureOutfit(userId, input);
      const wearLogId = await insertWearLog(userId, outfitId, input);
      await markOutfitWorn(outfitId);
      await bumpPairAffinity(
        userId,
        input.items.map((item) => item.id),
        PAIR_AFFINITY.wearDelta,
      );

      return { outfitId, wearLogId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["pair-affinity"] });
      queryClient.invalidateQueries({ queryKey: ["wear-log"] });
      queryClient.invalidateQueries({ queryKey: ["recent-wears"] });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't log this outfit." }),
  });
}

const ensureOutfit = async (userId: string, input: LogWearInput): Promise<string> => {
  if (input.outfitId) return input.outfitId;

  const { data: outfit, error } = await supabase
    .from("outfits")
    .insert({ user_id: userId, worn_count: 0 })
    .select()
    .single();
  if (error) throw error;

  const links = input.items.map((item) => ({
    outfit_id: outfit.id,
    item_id: item.id,
  }));
  const { error: linkError } = await supabase.from("outfit_items").insert(links);
  if (linkError) throw linkError;

  return outfit.id;
};

type WeatherSnapshotJson = {
  tempC: number;
  precipProb: number;
  weatherCode: number;
  summary: string;
};

type WearLogInsert = {
  user_id: string;
  outfit_id: string;
  affinity_delta: number;
  worn_on?: string;
  weather?: WeatherSnapshotJson;
};

const insertWearLog = async (
  userId: string,
  outfitId: string,
  input: LogWearInput,
): Promise<string> => {
  const row: WearLogInsert = {
    user_id: userId,
    outfit_id: outfitId,
    affinity_delta: PAIR_AFFINITY.wearDelta,
  };
  if (input.wornOn !== undefined) row.worn_on = toDateString(input.wornOn);
  if (input.weather) row.weather = serializeWeather(input.weather);

  const { data, error } = await supabase
    .from("wear_log")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

const markOutfitWorn = async (outfitId: string): Promise<void> => {
  const { data: current, error: readError } = await supabase
    .from("outfits")
    .select("worn_count")
    .eq("id", outfitId)
    .single();
  if (readError) throw readError;
  if (!current) throw new Error("Outfit not found");

  const { error } = await supabase
    .from("outfits")
    .update({
      worn_count: current.worn_count + 1,
      last_worn_at: new Date().toISOString(),
    })
    .eq("id", outfitId);
  if (error) throw error;
};

const serializeWeather = (snapshot: WeatherSnapshot): WeatherSnapshotJson => {
  return {
    tempC: snapshot.tempC,
    precipProb: snapshot.precipProb,
    weatherCode: snapshot.weatherCode,
    summary: snapshot.summary,
  };
};

