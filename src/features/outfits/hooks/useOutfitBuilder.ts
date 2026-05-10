import { useMemo, useState } from "react";
import type { Item, Category } from "~/types/items";

export type BuilderState = {
  itemsBySlot: Map<Category, Item>;
  selectedItems: Item[];
  pickItem: (slot: Category, item: Item) => void;
  removeSlot: (slot: Category) => void;
  clear: () => void;
};

export const useOutfitBuilder = (): BuilderState => {
  const [itemsBySlot, setItemsBySlot] = useState<Map<Category, Item>>(new Map());

  const pickItem = (slot: Category, item: Item) => {
    setItemsBySlot((current) => {
      const next = new Map(current);
      next.set(slot, item);
      return next;
    });
  };

  const removeSlot = (slot: Category) => {
    setItemsBySlot((current) => {
      const next = new Map(current);
      next.delete(slot);
      return next;
    });
  };

  const clear = () => setItemsBySlot(new Map());

  const selectedItems = useMemo(
    () => Array.from(itemsBySlot.values()),
    [itemsBySlot],
  );

  return { itemsBySlot, selectedItems, pickItem, removeSlot, clear };
};
