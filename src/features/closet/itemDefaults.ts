import type { Category, Formality, Pattern, Warmth } from "~/types/items";

// Per-category defaults so the form is fillable without touching formality or
// warmth — a dress shouldn't start at "loungewear", and outerwear shouldn't
// start at "tee weight". The user can still override; these just remove the
// need to override in the common case.
export const defaultFormalityFor = (category: Category): Formality => {
  if (category === "dress") return 4;
  if (category === "outerwear") return 3;
  if (category === "hat") return 2;
  if (category === "accessory") return 3;
  if (category === "bag") return 3;
  return 3;
};

export const defaultWarmthFor = (category: Category): Warmth => {
  if (category === "outerwear") return 3;
  if (category === "shoes") return 1;
  if (category === "bag") return 0;
  if (category === "accessory") return 0;
  if (category === "hat") return 1;
  return 2;
};

export const DEFAULT_PATTERN: Pattern = "solid";
