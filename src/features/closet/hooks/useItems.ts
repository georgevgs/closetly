import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Item } from "~/types/items";
import { itemFromRow, type ItemRow } from "../mapper";

export const itemsKeys = {
  all: ["items"] as const,
  list: (userId: string) => ["items", "list", userId] as const,
  one: (id: string) => ["items", "one", id] as const,
};

export function useItems(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? itemsKeys.list(userId) : ["items", "noop"],
    enabled: !!userId,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ItemRow[]).map(itemFromRow);
    },
  });
}

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: id ? itemsKeys.one(id) : ["items", "noop"],
    enabled: !!id,
    queryFn: async (): Promise<Item | null> => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? itemFromRow(data as ItemRow) : null;
    },
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("items").update({ archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKeys.all }),
  });
}
