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
  const paths = items.map((item) => storagePathFor(item));
  if (paths.length === 0) return items;
  const { data, error } = await supabase.storage
    .from("closet-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error || !data) return items;
  return items.map((item, itemIndex) => signedCopy(item, data[itemIndex]?.signedUrl));
}

const storagePathFor = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};

// When no signed URL comes back, keep the originals as-is. When one comes back,
// route it to both photo_url and thumb_url *only if the original had them set* —
// preserving null on thumb_url so callers can still distinguish "thumb missing"
// from "thumb signed".
const signedCopy = (item: Item, signedUrl: string | null | undefined): Item => {
  if (!signedUrl) return item;
  return {
    ...item,
    photo_url: signedUrl,
    thumb_url: thumbForSigned(item.thumb_url, signedUrl),
  };
};

const thumbForSigned = (
  originalThumb: string | null,
  signedUrl: string,
): string | null => {
  if (originalThumb === null) return null;
  return signedUrl;
};
