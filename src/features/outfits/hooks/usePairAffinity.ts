import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { pairKey } from "~/lib/outfit/score";

export function usePairAffinity(userId: string | undefined) {
  return useQuery({
    queryKey: ["pair-affinity", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Map<string, number>> => {
      const { data, error } = await supabase
        .from("item_pair_affinity")
        .select("item_a, item_b, affinity")
        .eq("user_id", userId!);
      if (error) throw error;
      const map = new Map<string, number>();
      if (!data) return map;
      for (const row of data) {
        map.set(pairKey(row.item_a, row.item_b), row.affinity);
      }
      return map;
    },
  });
}
