import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { itemsKeys } from "./useItems";

// Atomic increment via RPC so a double-tap on the wash button doesn't lose
// a count to a read-modify-write race.
export const useMarkWashed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string): Promise<number> => {
      const { data, error } = await supabase.rpc("increment_times_washed", {
        p_item_id: itemId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, itemId) => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.one(itemId) });
      queryClient.invalidateQueries({ queryKey: itemsKeys.all });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't log this wash." }),
  });
};
