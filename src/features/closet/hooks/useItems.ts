import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "~/lib/supabase";
import { handleError } from "~/lib/handleError";
import type {
  Item,
  Category,
  Style,
  Season,
  Pattern,
  Formality,
  Warmth,
  Silhouette,
  Occasion,
} from "~/types/items";
import type { Json, TablesUpdate } from "~/types/database";
import { itemFromRow, type ItemRow } from "../mapper";
import { uploadItemImage } from "../upload";
import { analyzeItemFromUri, visionColorsToItemColors } from "../vision";

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
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't remove this item." }),
  });
}

export type UpdateItemInput = {
  id: string;
  name: string | null;
  category: Category;
  styles: Style[];
  seasons: Season[];
  pattern: Pattern;
  formality: Formality;
  warmth: Warmth;
  occasions: Occasion[];
  price: number | null;
  currency: string | null;
  purchasedOn: string | null;
  silhouette?: Silhouette | null;
};

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateItemInput) => {
      const { id, silhouette, purchasedOn, ...columns } = input;

      if (silhouette !== undefined) {
        await writeSilhouette(id, silhouette);
      }

      const { error } = await supabase
        .from("items")
        .update({ ...columns, purchased_on: purchasedOn })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: itemsKeys.all });
      qc.invalidateQueries({ queryKey: itemsKeys.one(vars.id) });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't save your changes." }),
  });
}

// vision_attrs is a non-strict jsonb blob (colors, silhouette, future fields).
// We read-modify-write so a silhouette change doesn't clobber the stored colors.
const writeSilhouette = async (
  itemId: string,
  silhouette: Silhouette | null,
): Promise<void> => {
  const { data: row, error: readError } = await supabase
    .from("items")
    .select("vision_attrs")
    .eq("id", itemId)
    .maybeSingle();
  if (readError) throw readError;

  const current = mergeableVisionAttrs(row?.vision_attrs);
  const next = { ...current, silhouette };

  const { error } = await supabase
    .from("items")
    .update({ vision_attrs: next as unknown as Json })
    .eq("id", itemId);
  if (error) throw error;
};

const mergeableVisionAttrs = (raw: unknown): Record<string, unknown> => {
  if (!raw) return {};
  if (typeof raw !== "object") return {};
  return raw as Record<string, unknown>;
};

export function useReplaceItemPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      photoUri,
      analysisUri,
    }: {
      id: string;
      photoUri: string;
      analysisUri?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      await uploadItemImage(photoUri, userId, id);
      const visionAttrs = await analyzeItemFromUri(analysisUri ?? photoUri);
      const colors = visionColorsToItemColors(visionAttrs.colors);

      const { error } = await supabase
        .from("items")
        .update({
          colors: colors as unknown as TablesUpdate<"items">["colors"],
          vision_attrs: visionAttrs as unknown as Json,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: itemsKeys.all });
      qc.invalidateQueries({ queryKey: itemsKeys.one(vars.id) });
      qc.invalidateQueries({ queryKey: ["item-signed", vars.id] });
    },
    onError: (error) =>
      handleError(error, { fallbackMessage: "Couldn't replace the photo." }),
  });
}
