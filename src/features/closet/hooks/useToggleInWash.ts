import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { itemsKeys } from "./useItems";

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
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.one(input.itemId) });
      queryClient.invalidateQueries({ queryKey: itemsKeys.all });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't update wash status." }),
  });
};
