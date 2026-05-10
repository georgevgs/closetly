import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Item } from "~/types/items";
import { handleError } from "~/lib/handleError";
import { requireUserId } from "~/features/auth/requireUserId";
import { bumpPairAffinity } from "../affinity";
import { PAIR_AFFINITY } from "../tuning";

export type DismissSuggestionInput = {
  items: Item[];
};

export function useDismissSuggestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DismissSuggestionInput): Promise<void> => {
      const userId = await requireUserId();
      await bumpPairAffinity(
        userId,
        input.items.map((item) => item.id),
        PAIR_AFFINITY.dismissDelta,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pair-affinity"] });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't dismiss that suggestion." }),
  });
}
