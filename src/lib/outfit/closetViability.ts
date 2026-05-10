import type { Item, Category } from "~/types/items";

// Whether the closet has enough variety for the combinator to build any
// full outfit at all. The combinator needs either a (top + bottom + shoes)
// or a (dress + shoes), so a closet with three tops and nothing else is not
// viable even though it passes a "≥3 items" gate.
export type ClosetViability =
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "missing"; missing: Category[] };

export const assessClosetViability = (items: Item[]): ClosetViability => {
  if (items.length === 0) return { kind: "empty" };

  const present = presentCategories(items);
  if (canBuildFullLook(present)) return { kind: "ready" };

  return { kind: "missing", missing: missingForViability(present) };
};

const presentCategories = (items: Item[]): Set<Category> => {
  const set = new Set<Category>();
  for (const item of items) set.add(item.category);
  return set;
};

const canBuildFullLook = (present: Set<Category>): boolean => {
  if (!present.has("shoes")) return false;
  if (present.has("dress")) return true;
  if (present.has("top") && present.has("bottom")) return true;
  return false;
};

// Suggests the smallest set of additions that would make the closet viable.
// Prefers the top+bottom path when neither path is currently complete, since
// most users start there.
const missingForViability = (present: Set<Category>): Category[] => {
  const missing: Category[] = [];
  if (!present.has("shoes")) missing.push("shoes");
  if (present.has("dress")) return missing;
  if (!present.has("top")) missing.push("top");
  if (!present.has("bottom")) missing.push("bottom");
  return missing;
};
