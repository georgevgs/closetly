import { useQuery } from "@tanstack/react-query";
import type { Item } from "~/types/items";
import { useItems } from "./useItems";
import { signItemUrls } from "../mapper";

export function useSignedItems(userId: string | undefined) {
  const items = useItems(userId);
  return useQuery({
    queryKey: ["items", "signed", userId, items.dataUpdatedAt],
    enabled: !!items.data,
    queryFn: () => signItemUrls(itemsOrEmpty(items.data)),
    staleTime: 30 * 60 * 1000,
  });
}

const itemsOrEmpty = (items: Item[] | undefined): Item[] => {
  if (!items) return [];
  return items;
};
