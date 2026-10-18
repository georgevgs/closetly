import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { Item } from "~/types/items";
import { itemsKeys } from "./useItems";

export type ItemPatches = ReadonlyMap<string, Partial<Item>>;

type ListSnapshot = [QueryKey, Item[] | undefined];
type SingleSnapshot = [QueryKey, Item | null | undefined];

export type ItemCacheSnapshot = {
  lists: ListSnapshot[];
  singles: SingleSnapshot[];
};

const RAW_LIST_PREFIX: QueryKey = ["items", "list"];
const SIGNED_LIST_PREFIX: QueryKey = ["items", "signed"];
const LIST_PREFIXES: QueryKey[] = [RAW_LIST_PREFIX, SIGNED_LIST_PREFIX];

const patchList = (
  items: Item[] | undefined,
  patches: ItemPatches,
): Item[] | undefined => {
  if (!items) return items;
  return items.map((entry) => patchOne(entry, patches));
};

const patchOne = (item: Item, patches: ItemPatches): Item => {
  const patch = patches.get(item.id);
  if (!patch) return item;
  return { ...item, ...patch };
};

const patchSingle = (
  item: Item | null | undefined,
  patches: ItemPatches,
): Item | null | undefined => {
  if (!item) return item;
  return patchOne(item, patches);
};

const cancelItemQueries = async (queryClient: QueryClient, itemIds: string[]) => {
  for (const prefix of LIST_PREFIXES) {
    await queryClient.cancelQueries({ queryKey: prefix });
  }
  for (const itemId of itemIds) {
    await queryClient.cancelQueries({ queryKey: itemsKeys.one(itemId) });
  }
};

const snapshotLists = (queryClient: QueryClient): ListSnapshot[] => {
  const snapshots: ListSnapshot[] = [];
  for (const prefix of LIST_PREFIXES) {
    const entries = queryClient.getQueriesData<Item[]>({ queryKey: prefix });
    for (const [key, data] of entries) snapshots.push([key, data]);
  }
  return snapshots;
};

const snapshotSingles = (queryClient: QueryClient, itemIds: string[]): SingleSnapshot[] => {
  return itemIds.map((itemId) => {
    const key = itemsKeys.one(itemId);
    return [key, queryClient.getQueryData<Item | null>(key)];
  });
};

// Applies the patches to every cached copy of the affected items (raw list,
// signed list, single-item detail) and returns what was there before so a
// failed mutation can roll back.
export const applyOptimisticItemPatches = async (
  queryClient: QueryClient,
  patches: ItemPatches,
): Promise<ItemCacheSnapshot> => {
  const itemIds = [...patches.keys()];
  await cancelItemQueries(queryClient, itemIds);

  const snapshot: ItemCacheSnapshot = {
    lists: snapshotLists(queryClient),
    singles: snapshotSingles(queryClient, itemIds),
  };

  for (const prefix of LIST_PREFIXES) {
    queryClient.setQueriesData<Item[]>({ queryKey: prefix }, (current) =>
      patchList(current, patches),
    );
  }
  for (const itemId of itemIds) {
    queryClient.setQueryData<Item | null>(itemsKeys.one(itemId), (current) =>
      patchSingle(current, patches),
    );
  }
  return snapshot;
};

export const restoreItemCaches = (
  queryClient: QueryClient,
  snapshot: ItemCacheSnapshot,
) => {
  for (const [key, data] of snapshot.lists) queryClient.setQueryData(key, data);
  for (const [key, data] of snapshot.singles) queryClient.setQueryData(key, data);
};
