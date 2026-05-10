import type { HSL } from "../lib/color/hsl";

export const CATEGORIES = [
  "top",
  "bottom",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "hat",
  "accessory",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STYLES = [
  "minimal",
  "classic",
  "streetwear",
  "elegant",
  "bohemian",
  "sporty",
  "preppy",
  "edgy",
] as const;
export type Style = (typeof STYLES)[number];

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const PATTERNS = [
  "solid",
  "striped",
  "plaid",
  "floral",
  "graphic",
  "animal",
  "print",
] as const;
export type Pattern = (typeof PATTERNS)[number];

export type Formality = 1 | 2 | 3 | 4 | 5;
export type Warmth = 0 | 1 | 2 | 3 | 4;

export type ItemColor = { hex: string; hsl: HSL };

export type Silhouette = {
  fit: "slim" | "regular" | "relaxed" | "oversized";
  length?: "cropped" | "regular" | "long" | "na";
  rise?: "high" | "mid" | "low" | "na";
};

export const STYLE_ADJACENCY: Record<Style, readonly Style[]> = {
  minimal: ["classic", "elegant"],
  classic: ["minimal", "elegant", "preppy"],
  elegant: ["minimal", "classic", "preppy", "bohemian"],
  preppy: ["classic", "elegant"],
  streetwear: ["sporty", "edgy"],
  sporty: ["streetwear", "edgy"],
  edgy: ["streetwear", "sporty"],
  bohemian: ["elegant"],
} as const;

export type Item = {
  id: string;
  user_id: string;
  category: Category;
  name: string | null;
  photo_url: string;
  thumb_url: string | null;
  colors: ItemColor[];
  formality: Formality;
  seasons: Season[];
  styles: Style[];
  warmth: Warmth;
  pattern: Pattern;
  silhouette: Silhouette | null;
  brand: string | null;
  notes: string | null;
  created_at: string;
};

export type VisionAttrs = {
  colors: { hex: string }[];
  silhouette?: Silhouette;
};

export type Outfit = {
  id: string;
  user_id: string;
  item_ids: string[];
  name: string | null;
  rating: number | null;
  worn_count: number;
  last_worn_at: string | null;
  created_at: string;
};

export const REQUIRED_SLOTS: Category[] = ["top", "bottom", "shoes"];
export const OPTIONAL_SLOTS: Category[] = ["outerwear", "bag", "hat", "accessory"];
