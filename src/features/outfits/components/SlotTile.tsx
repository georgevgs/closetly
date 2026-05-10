import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import type { Category, Item } from "~/types/items";

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

export function SlotTile({
  slot,
  item,
  onPress,
  onLongPress,
}: {
  slot: Category;
  item: Item | undefined;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  if (!item) return <EmptySlot slot={slot} onPress={onPress} />;
  return <FilledSlot item={item} slot={slot} onPress={onPress} onLongPress={onLongPress} />;
}

function EmptySlot({ slot, onPress }: { slot: Category; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ aspectRatio: 1 }}
      className="rounded-xl border-2 border-dashed border-line dark:border-line-dark items-center justify-center bg-canvas dark:bg-canvas-dark"
    >
      <SymbolView name="plus" size={20} tintColor="#a8a29e" />
      <Text variant="caption" className="mt-1">
        {SLOT_LABELS[slot]}
      </Text>
    </Pressable>
  );
}

function FilledSlot({
  item,
  slot,
  onPress,
  onLongPress,
}: {
  item: Item;
  slot: Category;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ aspectRatio: 1 }}
      className="rounded-xl overflow-hidden border border-line dark:border-line-dark bg-white dark:bg-[#1a1816]"
    >
      <Image
        source={{ uri: thumbnailUri(item) }}
        style={{ flex: 1 }}
        contentFit="cover"
        transition={150}
      />
      <View className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-canvas/85 dark:bg-canvas-dark/85">
        <Text variant="caption">{SLOT_LABELS[slot]}</Text>
      </View>
    </Pressable>
  );
}

const thumbnailUri = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};
