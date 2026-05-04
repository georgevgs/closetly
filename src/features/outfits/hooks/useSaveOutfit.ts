import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import type { Item } from "~/types/items";

export type SaveOutfitInput = {
  items: Item[];
  rating?: number;
  name?: string;
  favorite?: boolean;
};

const PAIR_AFFINITY_BOOST = 1.0;

export function useSaveOutfit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveOutfitInput) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: outfit, error } = await supabase
        .from("outfits")
        .insert({
          user_id: userId,
          name: input.name ?? null,
          rating: input.rating ?? null,
          worn_count: 0,
        })
        .select()
        .single();
      if (error) throw error;

      const links = input.items.map((it) => ({
        outfit_id: outfit.id,
        item_id: it.id,
      }));
      const { error: linkErr } = await supabase.from("outfit_items").insert(links);
      if (linkErr) throw linkErr;

      if (input.favorite) {
        await supabase.from("favorites").insert({ user_id: userId, outfit_id: outfit.id });
      }

      await bumpPairAffinity(userId, input.items, input.rating ?? 4);

      return outfit;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outfits"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["pair-affinity"] });
    },
  });
}

async function bumpPairAffinity(userId: string, items: Item[], rating: number) {
  const ratingDelta = (rating - 3) / 2; // -1..+1
  const delta = PAIR_AFFINITY_BOOST * ratingDelta;
  if (delta === 0) return;

  const rows: { user_id: string; item_a: string; item_b: string; affinity: number }[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const [a, b] =
        items[i].id < items[j].id ? [items[i].id, items[j].id] : [items[j].id, items[i].id];
      rows.push({ user_id: userId, item_a: a, item_b: b, affinity: delta });
    }
  }

  for (const row of rows) {
    const { data: existing } = await supabase
      .from("item_pair_affinity")
      .select("affinity")
      .eq("user_id", row.user_id)
      .eq("item_a", row.item_a)
      .eq("item_b", row.item_b)
      .maybeSingle();
    const next = (existing?.affinity ?? 0) + row.affinity;
    await supabase.from("item_pair_affinity").upsert({ ...row, affinity: clamp(next, -2, 2) });
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
