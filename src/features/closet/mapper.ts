import type { Tables } from "~/types/database";
import type { Item, ItemColor, Formality, Silhouette, Warmth } from "~/types/items";
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
    colors: rowColors(row.colors),
    formality: row.formality as Formality,
    warmth: row.warmth as Warmth,
    pattern: row.pattern,
    seasons: row.seasons,
    styles: row.styles,
    silhouette: silhouetteFromVisionAttrs(row.vision_attrs),
    brand: row.brand,
    notes: row.notes,
    occasions: row.occasions,
    price: priceFromRow(row.price),
    currency: row.currency,
    purchasedOn: row.purchased_on,
    timesWashed: row.times_washed,
    created_at: row.created_at,
  };
}

const rowColors = (raw: ItemRow["colors"]): ItemColor[] => {
  if (!raw) return [];
  return raw as ItemColor[];
};

const silhouetteFromVisionAttrs = (raw: ItemRow["vision_attrs"]): Silhouette | null => {
  if (!raw) return null;
  if (typeof raw !== "object") return null;
  const candidate = (raw as { silhouette?: Silhouette }).silhouette;
  if (!candidate) return null;
  return candidate;
};

// Postgres `numeric` columns serialise to string via PostgREST. Coerce so
// downstream cost-per-wear math works without surprise string concatenation.
const priceFromRow = (raw: ItemRow["price"]): number | null => {
  if (raw === null) return null;
  if (typeof raw === "number") return raw;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

export async function signItemUrls(items: Item[]): Promise<Item[]> {
  if (items.length === 0) return items;

  const photoPaths = items.map((item) => item.photo_url);
  const thumbPaths = items.map((item) => item.thumb_url);

  const signedPhotos = await signBatch(photoPaths);
  const signedThumbs = await signBatch(thumbPaths);

  return items.map((item, itemIndex) => ({
    ...item,
    photo_url: signedOrOriginal(signedPhotos[itemIndex], item.photo_url),
    thumb_url: signedOrOriginal(signedThumbs[itemIndex], item.thumb_url),
  }));
}

const signBatch = async (
  paths: (string | null)[],
): Promise<(string | null)[]> => {
  const presentPaths = paths.filter((path): path is string => path !== null);
  if (presentPaths.length === 0) return paths.map(() => null);

  const { data, error } = await supabase.storage
    .from("closet-photos")
    .createSignedUrls(presentPaths, SIGNED_URL_TTL);
  if (error || !data) return paths.map(() => null);

  const signedByPath = new Map<string, string>();
  data.forEach((entry, entryIndex) => {
    const originalPath = presentPaths[entryIndex];
    if (entry.signedUrl) signedByPath.set(originalPath, entry.signedUrl);
  });

  return paths.map((path) => {
    if (path === null) return null;
    return signedByPath.get(path) ?? null;
  });
};

const signedOrOriginal = <T extends string | null>(
  signedUrl: string | null,
  original: T,
): T | string => {
  if (signedUrl) return signedUrl;
  return original;
};
