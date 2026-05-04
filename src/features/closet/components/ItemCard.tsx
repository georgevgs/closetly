import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "~/components/ui/Text";
import type { Item, Category } from "~/types/items";
import { cn } from "~/lib/utils";

const CATEGORY_FALLBACK: Record<Category, string> = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bag",
  hat: "Hat",
  accessory: "Accessory",
};

type Props = {
  item: Item;
  onPress?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
};

const aspect = { sm: 1, md: 1, lg: 1 };

export function ItemCard({ item, onPress, selected, size = "md" }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-lg overflow-hidden bg-white dark:bg-[#1a1816] border",
        selected ? "border-ink dark:border-ink-dark" : "border-line dark:border-line-dark"
      )}
      style={{ aspectRatio: aspect[size] }}
    >
      <Image
        source={{ uri: item.thumb_url ?? item.photo_url }}
        style={{ flex: 1 }}
        contentFit="cover"
        transition={150}
      />
      {(item.name || item.colors[0]) && (
        <View className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-canvas/85 dark:bg-canvas-dark/85 flex-row items-center gap-2">
          {item.colors[0] && (
            <View
              className="w-3 h-3 rounded-full border border-line"
              style={{ backgroundColor: item.colors[0].hex }}
            />
          )}
          <Text variant="caption" numberOfLines={1} className="flex-1">
            {item.name ?? CATEGORY_FALLBACK[item.category]}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
