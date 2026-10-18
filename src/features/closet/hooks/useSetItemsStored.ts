import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import type { Item } from "~/types/items";
import {
  applyOptimisticItemPatches,
  restoreItemCaches,
  type ItemCacheSnapshot,
  type ItemPatches,
} from "./itemCachePatch";

export type SetItemsStoredInput = {
  storeItemIds: string[];
  returnItemIds: string[];
};

const buildPatches = (input: SetItemsStoredInput, now: string): ItemPatches => {
  const patches = new Map<string, Partial<Item>>();
  for (const itemId of input.storeItemIds) patches.set(itemId, { storedAt: now });
  for (const itemId of input.returnItemIds) patches.set(itemId, { storedAt: null });
  return patches;
};

// Packs pieces away and brings others back in one atomic call — used both
// for a single item from its detail screen and for a whole season swap.
export const useSetItemsStored = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SetItemsStoredInput) => {
      const { error } = await supabase.rpc("apply_season_swap", {
        p_store_ids: input.storeItemIds,
        p_return_ids: input.returnItemIds,
      });
      if (error) throw error;
    },
    onMutate: (input): Promise<ItemCacheSnapshot> => {
      const patches = buildPatches(input, new Date().toISOString());
      return applyOptimisticItemPatches(queryClient, patches);
    },
    onError: (error, _input, snapshot) => {
      if (snapshot) restoreItemCaches(queryClient, snapshot);
      handleError(error, { fallbackMessage: "Couldn't update storage." });
    },
  });
};
