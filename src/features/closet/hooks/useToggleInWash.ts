import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import type { Item } from "~/types/items";
import { itemsKeys } from "./useItems";

export type ToggleInWashInput = {
  itemId: string;
  inWash: boolean;
};

type ListSnapshot = [QueryKey, Item[] | undefined];

type MutationContext = {
  listSnapshots: ListSnapshot[];
  singleSnapshot: Item | null | undefined;
};

const RAW_LIST_PREFIX: QueryKey = ["items", "list"];
const SIGNED_LIST_PREFIX: QueryKey = ["items", "signed"];

const patchItemInList = (
  items: Item[] | undefined,
  itemId: string,
  inWash: boolean,
): Item[] | undefined => {
  if (!items) return items;
  return items.map((entry) => {
    if (entry.id !== itemId) return entry;
    return { ...entry, inWash };
  });
};

const patchSingleItem = (
  item: Item | null | undefined,
  inWash: boolean,
): Item | null | undefined => {
  if (!item) return item;
  return { ...item, inWash };
};

const snapshotLists = (
  queryClient: QueryClient,
  prefix: QueryKey,
): ListSnapshot[] => {
  const entries = queryClient.getQueriesData<Item[]>({ queryKey: prefix });
  return entries.map(([key, data]) => [key, data]);
};

const patchLists = (
  queryClient: QueryClient,
  prefix: QueryKey,
  itemId: string,
  inWash: boolean,
) => {
  queryClient.setQueriesData<Item[]>({ queryKey: prefix }, (current) =>
    patchItemInList(current, itemId, inWash),
  );
};

const restoreLists = (queryClient: QueryClient, snapshots: ListSnapshot[]) => {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
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
    onMutate: async (input): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: RAW_LIST_PREFIX });
      await queryClient.cancelQueries({ queryKey: SIGNED_LIST_PREFIX });
      await queryClient.cancelQueries({ queryKey: itemsKeys.one(input.itemId) });

      const rawSnapshots = snapshotLists(queryClient, RAW_LIST_PREFIX);
      const signedSnapshots = snapshotLists(queryClient, SIGNED_LIST_PREFIX);
      const singleKey = itemsKeys.one(input.itemId);
      const singleSnapshot = queryClient.getQueryData<Item | null>(singleKey);

      patchLists(queryClient, RAW_LIST_PREFIX, input.itemId, input.inWash);
      patchLists(queryClient, SIGNED_LIST_PREFIX, input.itemId, input.inWash);
      queryClient.setQueryData<Item | null>(singleKey, (current) =>
        patchSingleItem(current, input.inWash),
      );

      return {
        listSnapshots: [...rawSnapshots, ...signedSnapshots],
        singleSnapshot,
      };
    },
    onError: (error, input, context) => {
      if (context) {
        restoreLists(queryClient, context.listSnapshots);
        queryClient.setQueryData(itemsKeys.one(input.itemId), context.singleSnapshot);
      }
      handleError(error, { fallbackMessage: "Couldn't update wash status." });
    },
  });
};
