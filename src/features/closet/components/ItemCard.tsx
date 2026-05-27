import { View } from "react-native";
import { Image, type ImageProps } from "expo-image";
import { Text } from "~/components/ui/Text";
import { PressableScale } from "~/components/ui/PressableScale";
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

type ImagePriority = NonNullable<ImageProps["priority"]>;

type Props = {
  item: Item;
  onPress?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: ImagePriority;
};

const aspect = { sm: 1, md: 1, lg: 1 };

export function ItemCard({
  item,
  onPress,
  selected,
  size = "md",
  priority = "normal",
}: Props) {
  const previewUri = previewImageUri(item);
  const displayLabel = labelFor(item);
  const showLabel = displayLabel !== null || item.colors[0] !== undefined;

  const accessibilityLabel = captionLabel(displayLabel, item.category);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        "rounded-lg overflow-hidden bg-canvas dark:bg-canvas-dark border",
        cardBorderClass(selected),
      )}
      style={{ aspectRatio: aspect[size] }}
    >
      <Image
        source={{ uri: previewUri }}
        recyclingKey={previewUri}
        style={{ flex: 1 }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        priority={priority}
      />
      {showLabel && (
        <View className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-canvas/85 dark:bg-canvas-dark/85 flex-row items-center gap-2">
          {item.colors[0] && (
            <View
              className="w-3 h-3 rounded-full border border-line"
              style={{ backgroundColor: item.colors[0].hex }}
            />
          )}
          <Text variant="caption" numberOfLines={1} className="flex-1">
            {captionLabel(displayLabel, item.category)}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const cardBorderClass = (selected: boolean | undefined): string => {
  if (selected) return "border-ink dark:border-ink-dark";
  return "border-line dark:border-line-dark";
};

const previewImageUri = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};

const labelFor = (item: Item): string | null => {
  if (item.name) return item.name;
  return null;
};

const captionLabel = (
  displayLabel: string | null,
  category: Category,
): string => {
  if (displayLabel !== null) return displayLabel;
  return CATEGORY_FALLBACK[category];
};
