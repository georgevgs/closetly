import { forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { Text } from "~/components/ui/Text";
import { ItemCard } from "~/features/closet/components/ItemCard";
import type { Category, Item } from "~/types/items";

const SNAP_POINTS = ["85%"];
const COLUMN_COUNT = 3;

const SLOT_LABELS: Record<Category, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bag",
  hat: "Hat",
  accessory: "Accessory",
};

export type SlotPickerSheetProps = {
  slot: Category | null;
  currentItem: Item | undefined;
  items: Item[];
  onPick: (item: Item) => void;
  onRemove: () => void;
};

export const SlotPickerSheet = forwardRef<BottomSheetModal, SlotPickerSheetProps>(
  function SlotPickerSheet({ slot, currentItem, items, onPick, onRemove }, ref) {
    const [searchText, setSearchText] = useState("");

    const renderBackdrop = useCallback(
      (backdropProps: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...backdropProps}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [],
    );

    const handleClose = useCallback(() => setSearchText(""), []);

    const candidates = useMemo(() => {
      if (slot === null) return [];
      const inCategory = items.filter((item) => item.category === slot);
      return applySearch(inCategory, searchText);
    }, [items, slot, searchText]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        onDismiss={handleClose}
      >
        <PickerHeader
          slot={slot}
          hasCurrent={currentItem !== undefined}
          onRemove={onRemove}
        />
        <SearchBar value={searchText} onChangeText={setSearchText} />
        <BottomSheetFlatList
          data={candidates}
          keyExtractor={keyForItem}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
          ListEmptyComponent={<PickerEmptyState slot={slot} />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 / COLUMN_COUNT }}>
              <ItemCard
                item={item}
                selected={currentItem?.id === item.id}
                onPress={() => onPick(item)}
              />
            </View>
          )}
        />
      </BottomSheetModal>
    );
  },
);

function PickerHeader({
  slot,
  hasCurrent,
  onRemove,
}: {
  slot: Category | null;
  hasCurrent: boolean;
  onRemove: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark">
      <Text variant="title">{titleFor(slot)}</Text>
      {hasCurrent && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text variant="caption" className="underline text-red-600">
            Remove
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function SearchBar({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (next: string) => void;
}) {
  return (
    <View className="px-4 pt-3 pb-2">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by name or brand"
        placeholderTextColor="#a8a29e"
        className="h-10 px-4 rounded-full border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        returnKeyType="search"
      />
    </View>
  );
}

function PickerEmptyState({ slot }: { slot: Category | null }) {
  return (
    <View className="px-6 py-10 items-center">
      <Text variant="body" className="text-center">
        {emptyMessageFor(slot)}
      </Text>
    </View>
  );
}

const applySearch = (items: Item[], searchText: string): Item[] => {
  const needle = searchText.trim().toLowerCase();
  if (needle.length === 0) return items;
  return items.filter((item) => matchesNeedle(item, needle));
};

const matchesNeedle = (item: Item, needle: string): boolean => {
  if (item.name && item.name.toLowerCase().includes(needle)) return true;
  if (item.brand && item.brand.toLowerCase().includes(needle)) return true;
  return false;
};

const keyForItem = (item: Item): string => item.id;

const titleFor = (slot: Category | null): string => {
  if (slot === null) return "Pick a piece";
  return `Pick a ${SLOT_LABELS[slot].toLowerCase()}`;
};

const emptyMessageFor = (slot: Category | null): string => {
  if (slot === null) return "Nothing to show.";
  return `No ${SLOT_LABELS[slot].toLowerCase()}s match your search.`;
};
