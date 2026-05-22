import type { Season, Warmth } from "~/types/items";

// Maps a warmth rating (0=bare … 4=parka) to the seasons the piece naturally
// fits — without layering. Used as a smart default when a user hasn't manually
// set seasons. The mapping intentionally narrows: a warmth-2 garment doesn't
// belong in winter, even if you could layer it under a coat.
export const seasonsForWarmth = (warmth: Warmth): Season[] => {
  if (warmth === 0) return ["summer"];
  if (warmth === 1) return ["spring", "summer"];
  if (warmth === 2) return ["spring", "summer", "autumn"];
  if (warmth === 3) return ["autumn", "winter"];
  return ["winter"];
};

export const warmthLabel = (warmth: Warmth): string => {
  if (warmth === 0) return "bare";
  if (warmth === 1) return "light";
  if (warmth === 2) return "regular";
  if (warmth === 3) return "warm";
  return "parka";
};
