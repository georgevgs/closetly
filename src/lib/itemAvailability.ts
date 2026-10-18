import type { Item } from "~/types/items";

export const isStored = (item: Item): boolean => {
  return item.storedAt !== null;
};

// Whether the user could put this piece on today: it's neither in the
// laundry nor packed away for the off-season.
export const isAvailableToWear = (item: Item): boolean => {
  if (item.inWash) return false;
  if (isStored(item)) return false;
  return true;
};

export const withoutStored = (items: Item[]): Item[] => {
  return items.filter((item) => !isStored(item));
};

export const onlyStored = (items: Item[]): Item[] => {
  return items.filter(isStored);
};
