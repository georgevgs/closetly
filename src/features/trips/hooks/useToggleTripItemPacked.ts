import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { tripKeys, type TripDetail } from "./useTrip";

export type ToggleTripItemPackedInput = {
  tripId: string;
  itemId: string;
  packed: boolean;
};

// Optimistic so the checkbox feels instant: we patch the cached detail before
// the network call, roll back on error, and refetch on settle to reconcile.
export const useToggleTripItemPacked = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ToggleTripItemPackedInput): Promise<void> => {
      const { error } = await supabase
        .from("trip_items")
        .update({ packed: input.packed })
        .eq("trip_id", input.tripId)
        .eq("item_id", input.itemId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const queryKey = tripKeys.detail(input.tripId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TripDetail | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<TripDetail | null>(
          queryKey,
          patchPackedFlag(previous, input.itemId, input.packed),
        );
      }
      return { previous };
    },
    onError: (error, input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(tripKeys.detail(input.tripId), context.previous);
      }
      handleError(error, { fallbackMessage: "Couldn't update packed status." });
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(input.tripId) });
    },
  });
};

const patchPackedFlag = (
  detail: TripDetail,
  itemId: string,
  packed: boolean,
): TripDetail => {
  return {
    ...detail,
    items: detail.items.map((entry) => {
      if (entry.item.id !== itemId) return entry;
      return { ...entry, packed };
    }),
  };
};
