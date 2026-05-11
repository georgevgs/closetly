import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { tripKeys, type TripDetail } from "./useTrip";

export type SetAllTripItemsPackedInput = {
  tripId: string;
  packed: boolean;
};

export const useSetAllTripItemsPacked = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetAllTripItemsPackedInput): Promise<void> => {
      const { error } = await supabase
        .from("trip_items")
        .update({ packed: input.packed })
        .eq("trip_id", input.tripId);
      if (error) throw error;
    },
    onMutate: async (input) => {
      const queryKey = tripKeys.detail(input.tripId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TripDetail | null>(queryKey);
      if (previous) {
        queryClient.setQueryData<TripDetail | null>(
          queryKey,
          patchAllPacked(previous, input.packed),
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

const patchAllPacked = (detail: TripDetail, packed: boolean): TripDetail => {
  return {
    ...detail,
    items: detail.items.map((entry) => ({ ...entry, packed })),
  };
};
