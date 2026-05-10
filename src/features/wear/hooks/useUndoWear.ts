import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { requireUserId } from "~/features/auth/requireUserId";
import { bumpPairAffinity } from "~/features/outfits/affinity";

export type UndoWearInput = {
  wearLogId: string;
};

export function useUndoWear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UndoWearInput): Promise<void> => {
      const userId = await requireUserId();

      const wear = await fetchWearLog(input.wearLogId);
      if (!wear) throw new Error("Wear log entry not found");

      if (wear.outfit_id) {
        const itemIds = await fetchOutfitItemIds(wear.outfit_id);
        if (wear.affinity_delta !== null && itemIds.length >= 2) {
          await bumpPairAffinity(userId, itemIds, -wear.affinity_delta);
        }
        await decrementWornCount(wear.outfit_id);
      }

      await deleteWearLog(input.wearLogId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wear-log"] });
      queryClient.invalidateQueries({ queryKey: ["recent-wears"] });
      queryClient.invalidateQueries({ queryKey: ["pair-affinity"] });
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
    },
  });
}

type WearLogRow = {
  id: string;
  outfit_id: string | null;
  affinity_delta: number | null;
};

const fetchWearLog = async (wearLogId: string): Promise<WearLogRow | null> => {
  const { data, error } = await supabase
    .from("wear_log")
    .select("id, outfit_id, affinity_delta")
    .eq("id", wearLogId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const fetchOutfitItemIds = async (outfitId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("outfit_items")
    .select("item_id")
    .eq("outfit_id", outfitId);
  if (error) throw error;
  if (!data) return [];
  return data.map((row) => row.item_id);
};

const decrementWornCount = async (outfitId: string): Promise<void> => {
  const { data: current, error: readError } = await supabase
    .from("outfits")
    .select("worn_count")
    .eq("id", outfitId)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return;

  const nextCount = nextWornCount(current.worn_count);
  const { error } = await supabase
    .from("outfits")
    .update({ worn_count: nextCount })
    .eq("id", outfitId);
  if (error) throw error;
};

const nextWornCount = (current: number): number => {
  if (current <= 1) return 0;
  return current - 1;
};

const deleteWearLog = async (wearLogId: string): Promise<void> => {
  const { error } = await supabase
    .from("wear_log")
    .delete()
    .eq("id", wearLogId);
  if (error) throw error;
};
