import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import {
  applyOptimisticItemPatches,
  restoreItemCaches,
  type ItemCacheSnapshot,
} from "./itemCachePatch";

export type ToggleInWashInput = {
  itemId: string;
  inWash: boolean;
};

export const useToggleInWash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ToggleInWashInput) => {
      const { error } = await supabase
        .from("items")
        .update({ in_wash: input.inWash })
        .eq("id", input.itemId);
      if (error) throw error;
    },
    onMutate: (input): Promise<ItemCacheSnapshot> => {
      const patches = new Map([[input.itemId, { inWash: input.inWash }]]);
      return applyOptimisticItemPatches(queryClient, patches);
    },
    onError: (error, _input, snapshot) => {
      if (snapshot) restoreItemCaches(queryClient, snapshot);
      handleError(error, { fallbackMessage: "Couldn't update wash status." });
    },
  });
};
