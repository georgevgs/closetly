import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import { requireUserId } from "~/features/auth/requireUserId";
import { toDateString } from "~/lib/dates";
import type { Item } from "~/types/items";

export type SavedTrip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  expectedTempMin: number | null;
  expectedTempMax: number | null;
  itemIds: string[];
  createdAt: string;
};

const tripsKeys = {
  all: ["trips"] as const,
  list: (userId: string) => ["trips", "list", userId] as const,
};

export const useTrips = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? tripsKeys.list(userId) : ["trips", "noop"],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SavedTrip[]> => {
      const trips = await fetchTrips(userId!);
      if (trips.length === 0) return [];

      const itemsByTrip = await fetchItemsByTrip(trips.map((trip) => trip.id));
      return trips.map((trip) => buildSavedTrip(trip, itemsByTrip));
    },
  });
};

export type CreateTripInput = {
  name: string;
  startDate: Date;
  endDate: Date;
  expectedTempMin: number;
  expectedTempMax: number;
  items: Item[];
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTripInput): Promise<SavedTrip> => {
      const userId = await requireUserId();
      const trip = await insertTrip(userId, input);
      await linkTripItems(trip.id, input.items);
      return {
        id: trip.id,
        name: trip.name,
        startDate: trip.start_date,
        endDate: trip.end_date,
        expectedTempMin: trip.expected_temp_min,
        expectedTempMax: trip.expected_temp_max,
        itemIds: input.items.map((item) => item.id),
        createdAt: trip.created_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKeys.all });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't save this trip." }),
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string): Promise<void> => {
      const { error } = await supabase.from("trips").delete().eq("id", tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripsKeys.all });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't delete this trip." }),
  });
};

type TripRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  expected_temp_min: number | null;
  expected_temp_max: number | null;
  created_at: string;
};

type TripItemRow = { trip_id: string; item_id: string };

const fetchTrips = async (userId: string): Promise<TripRow[]> => {
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, start_date, end_date, expected_temp_min, expected_temp_max, created_at")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return data;
};

const fetchItemsByTrip = async (tripIds: string[]): Promise<Map<string, string[]>> => {
  const byTrip = new Map<string, string[]>();
  if (tripIds.length === 0) return byTrip;

  const { data, error } = await supabase
    .from("trip_items")
    .select("trip_id, item_id")
    .in("trip_id", tripIds);
  if (error) throw error;
  if (!data) return byTrip;

  for (const link of data as TripItemRow[]) {
    addItemId(byTrip, link.trip_id, link.item_id);
  }
  return byTrip;
};

const addItemId = (
  byTrip: Map<string, string[]>,
  tripId: string,
  itemId: string,
): void => {
  const existing = byTrip.get(tripId);
  if (existing) {
    existing.push(itemId);
    return;
  }
  byTrip.set(tripId, [itemId]);
};

const buildSavedTrip = (
  trip: TripRow,
  itemsByTrip: Map<string, string[]>,
): SavedTrip => {
  const itemIds = itemsByTrip.get(trip.id);
  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date,
    endDate: trip.end_date,
    expectedTempMin: trip.expected_temp_min,
    expectedTempMax: trip.expected_temp_max,
    itemIds: itemIds === undefined ? [] : itemIds,
    createdAt: trip.created_at,
  };
};

const insertTrip = async (
  userId: string,
  input: CreateTripInput,
): Promise<TripRow> => {
  const { data, error } = await supabase
    .from("trips")
    .insert({
      user_id: userId,
      name: input.name,
      start_date: toDateString(input.startDate),
      end_date: toDateString(input.endDate),
      expected_temp_min: input.expectedTempMin,
      expected_temp_max: input.expectedTempMax,
    })
    .select("id, name, start_date, end_date, expected_temp_min, expected_temp_max, created_at")
    .single();
  if (error) throw error;
  return data;
};

const linkTripItems = async (tripId: string, items: Item[]): Promise<void> => {
  if (items.length === 0) return;
  const links = items.map((item) => ({ trip_id: tripId, item_id: item.id }));
  const { error } = await supabase.from("trip_items").insert(links);
  if (error) throw error;
};
