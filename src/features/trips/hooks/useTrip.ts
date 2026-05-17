import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { itemFromRow, signItemUrls, type ItemRow } from "~/features/closet/mapper";
import type { Item, Season } from "~/types/items";

export type TripItemEntry = {
  item: Item;
  packed: boolean;
};

export type TripDetail = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  expectedTempMin: number | null;
  expectedTempMax: number | null;
  destination: string | null;
  notes: string | null;
  seasons: Season[];
  createdAt: string;
  items: TripItemEntry[];
};

export const tripKeys = {
  all: ["trips"] as const,
  list: (userId: string) => ["trips", "list", userId] as const,
  detail: (tripId: string) => ["trips", "detail", tripId] as const,
  noop: ["trips", "noop"] as const,
};

const tripDetailKey = (tripId: string | undefined) => {
  if (tripId) return tripKeys.detail(tripId);
  return tripKeys.noop;
};

export const useTrip = (tripId: string | undefined) => {
  return useQuery<TripDetail | null>({
    queryKey: tripDetailKey(tripId),
    enabled: Boolean(tripId),
    queryFn: async () => {
      if (!tripId) return null;
      const trip = await fetchTrip(tripId);
      if (!trip) return null;
      const links = await fetchTripItems(tripId);
      const items = await fetchItems(links.map((link) => link.item_id));
      const signed = await signItemUrls(items);
      return buildDetail(trip, links, signed);
    },
  });
};

type TripRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  expected_temp_min: number | null;
  expected_temp_max: number | null;
  destination: string | null;
  notes: string | null;
  seasons: Season[];
  created_at: string;
};

type LinkRow = { item_id: string; packed: boolean };

const fetchTrip = async (tripId: string): Promise<TripRow | null> => {
  const { data, error } = await supabase
    .from("trips")
    .select(
      "id, name, start_date, end_date, expected_temp_min, expected_temp_max, destination, notes, seasons, created_at",
    )
    .eq("id", tripId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

const fetchTripItems = async (tripId: string): Promise<LinkRow[]> => {
  const { data, error } = await supabase
    .from("trip_items")
    .select("item_id, packed")
    .eq("trip_id", tripId);
  if (error) throw error;
  if (!data) return [];
  return data;
};

// Pulls items by id list with no archive filter — a trip that referenced an
// item still in the closet must keep showing it even if the user archived it
// later, otherwise saved trips silently shrink.
const fetchItems = async (itemIds: string[]): Promise<Item[]> => {
  if (itemIds.length === 0) return [];
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .in("id", itemIds);
  if (error) throw error;
  if (!data) return [];
  return (data as ItemRow[]).map(itemFromRow);
};

const buildDetail = (
  trip: TripRow,
  links: LinkRow[],
  items: Item[],
): TripDetail => {
  const itemsById = new Map<string, Item>();
  for (const item of items) itemsById.set(item.id, item);

  const entries: TripItemEntry[] = [];
  for (const link of links) {
    const item = itemsById.get(link.item_id);
    if (!item) continue;
    entries.push({ item, packed: link.packed });
  }

  return {
    id: trip.id,
    name: trip.name,
    startDate: trip.start_date,
    endDate: trip.end_date,
    expectedTempMin: trip.expected_temp_min,
    expectedTempMax: trip.expected_temp_max,
    destination: trip.destination,
    notes: trip.notes,
    seasons: trip.seasons,
    createdAt: trip.created_at,
    items: entries,
  };
};
