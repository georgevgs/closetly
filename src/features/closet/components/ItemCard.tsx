import { View } from "react-native";
import { Image, type ImageProps } from "expo-image";
import { SymbolView } from "expo-symbols";
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
  onLongPress?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  priority?: ImagePriority;
};

const aspect = { sm: 1, md: 1, lg: 1 };
const IN_WASH_IMAGE_OPACITY = 0.45;

export function ItemCard({
  item,
  onPress,
  onLongPress,
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
      onLongPress={onLongPress}
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
        style={{ flex: 1, opacity: imageOpacityFor(item) }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        priority={priority}
      />
      {item.inWash && <InWashBadge />}
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

function InWashBadge() {
  return (
    <View className="absolute top-2 left-2 flex-row items-center gap-1 px-2 py-1 rounded-full bg-canvas/90 dark:bg-canvas-dark/90 border border-line dark:border-line-dark">
      <SymbolView name="bubbles.and.sparkles.fill" size={11} tintColor="#3478F6" />
      <Text variant="caption">In wash</Text>
    </View>
  );
}

const imageOpacityFor = (item: Item): number => {
  if (item.inWash) return IN_WASH_IMAGE_OPACITY;
  return 1;
};

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
