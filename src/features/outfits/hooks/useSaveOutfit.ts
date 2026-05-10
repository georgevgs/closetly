import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { orNull } from "~/lib/utils";
import type { Item } from "~/types/items";
import { requireUserId } from "~/features/auth/requireUserId";
import { bumpPairAffinity } from "../affinity";
import { PAIR_AFFINITY, ratingToMultiplier } from "../tuning";

export type SaveOutfitInput = {
  items: Item[];
  rating?: number;
  name?: string;
  favorite?: boolean;
};

const DEFAULT_RATING_FOR_AFFINITY = 4;

export function useSaveOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveOutfitInput) => {
      const userId = await requireUserId();

      const outfit = await insertOutfit(userId, input);
      await linkOutfitItems(outfit.id, input.items);

      if (input.favorite) {
        await supabase.from("favorites").insert({ user_id: userId, outfit_id: outfit.id });
      }

      const rating = ratingForAffinity(input.rating);
      const delta = PAIR_AFFINITY.saveDelta * ratingToMultiplier(rating);
      await bumpPairAffinity(userId, input.items.map((item) => item.id), delta);

      return outfit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["pair-affinity"] });
    },
  });
}

const insertOutfit = async (userId: string, input: SaveOutfitInput) => {
  const { data, error } = await supabase
    .from("outfits")
    .insert({
      user_id: userId,
      name: orNull(input.name),
      rating: orNull(input.rating),
      worn_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

const linkOutfitItems = async (outfitId: string, items: Item[]): Promise<void> => {
  const links = items.map((item) => ({ outfit_id: outfitId, item_id: item.id }));
  const { error } = await supabase.from("outfit_items").insert(links);
  if (error) throw error;
};

const ratingForAffinity = (rating: number | undefined): number => {
  if (rating === undefined) return DEFAULT_RATING_FOR_AFFINITY;
  return rating;
};
