import { useQuery } from "@tanstack/react-query";
import { useItems } from "./useItems";
import { signItemUrls } from "../mapper";

export function useSignedItems(userId: string | undefined) {
  const items = useItems(userId);
  return useQuery({
    queryKey: ["items", "signed", userId, items.dataUpdatedAt],
    enabled: !!items.data,
    queryFn: () => signItemUrls(items.data ?? []),
    staleTime: 30 * 60 * 1000,
  });
}
