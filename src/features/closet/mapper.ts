import type { Tables } from "~/types/database";
import type { Item, ItemColor, Formality, Warmth } from "~/types/items";
import { supabase } from "~/lib/supabase";

export type ItemRow = Tables<"items">;

const SIGNED_URL_TTL = 60 * 60; // 1h

export function itemFromRow(row: ItemRow): Item {
  return {
    id: row.id,
    user_id: row.user_id,
    category: row.category,
    name: row.name,
    photo_url: row.photo_path,
    thumb_url: row.thumb_path,
    colors: (row.colors as ItemColor[]) ?? [],
    formality: row.formality as Formality,
    warmth: row.warmth as Warmth,
    pattern: row.pattern,
    seasons: row.seasons,
    styles: row.styles,
    brand: row.brand,
    notes: row.notes,
    created_at: row.created_at,
  };
}

export async function signItemUrls(items: Item[]): Promise<Item[]> {
  const paths = items.map((i) => i.thumb_url ?? i.photo_url);
  if (paths.length === 0) return items;
  const { data, error } = await supabase.storage
    .from("closet-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error || !data) return items;
  return items.map((item, i) => ({
    ...item,
    photo_url: data[i]?.signedUrl ?? item.photo_url,
    thumb_url: data[i]?.signedUrl ?? item.thumb_url,
  }));
}
