import { View } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Text } from "~/components/ui/Text";
import { Card } from "~/components/ui/Card";
import { PressableScale } from "~/components/ui/PressableScale";
import { CATEGORIES, type Category, type Item } from "~/types/items";
import { cn } from "~/lib/utils";
import { intentColors, radii } from "~/lib/designTokens";
import type { TripItemEntry } from "~/features/trips/hooks/useTrip";

const CATEGORY_LABELS: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bags",
  hat: "Hats",
  accessory: "Accessories",
};

export function PackingList({
  entries,
  onToggle,
}: {
  entries: TripItemEntry[];
  onToggle: (entry: TripItemEntry) => void;
}) {
  if (entries.length === 0) return <EmptyPacking />;
  const groups = groupByCategory(entries);
  return (
    <View style={{ gap: 16 }}>
      {groups.map((group) => (
        <CategoryBlock key={group.category} group={group} onToggle={onToggle} />
      ))}
    </View>
  );
}

function EmptyPacking() {
  return (
    <Card padding="lg">
      <Text variant="body">This trip has no pieces packed.</Text>
    </Card>
  );
}

type CategoryGroup = {
  category: Category;
  entries: TripItemEntry[];
};

function CategoryBlock({
  group,
  onToggle,
}: {
  group: CategoryGroup;
  onToggle: (entry: TripItemEntry) => void;
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        {categoryHeading(group)}
      </Text>
      <View style={{ gap: 8 }}>
        {group.entries.map((entry) => (
          <PackingRow key={entry.item.id} entry={entry} onToggle={onToggle} />
        ))}
      </View>
    </View>
  );
}

function PackingRow({
  entry,
  onToggle,
}: {
  entry: TripItemEntry;
  onToggle: (entry: TripItemEntry) => void;
}) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onToggle(entry);
  };
  return (
    <PressableScale
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={packingRowAccessibilityLabel(entry)}
      style={{ borderRadius: radii.row, padding: 8 }}
      className={cn(
        "flex-row items-center border",
        rowBorderClass(entry.packed),
      )}
    >
      <Thumbnail item={entry.item} faded={entry.packed} />
      <View className="flex-1 ml-3">
        <Text variant="body" numberOfLines={1} className={textTone(entry.packed)}>
          {itemDisplayName(entry.item)}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {itemSubline(entry.item)}
        </Text>
      </View>
      <PackedIndicator packed={entry.packed} />
    </PressableScale>
  );
}

const packingRowAccessibilityLabel = (entry: TripItemEntry): string => {
  const name = itemDisplayName(entry.item);
  if (entry.packed) return `${name}, packed. Tap to unpack.`;
  return `${name}, not packed. Tap to pack.`;
};

function Thumbnail({ item, faded }: { item: Item; faded: boolean }) {
  return (
    <View
      className="rounded-md overflow-hidden bg-canvas dark:bg-canvas-dark"
      style={{ width: 44, height: 44, opacity: thumbnailOpacity(faded) }}
    >
      <Image
        source={{ uri: thumbnailUri(item) }}
        style={{ flex: 1 }}
        contentFit="cover"
      />
    </View>
  );
}

function PackedIndicator({ packed }: { packed: boolean }) {
  return (
    <SymbolView
      name={packedIcon(packed)}
      size={22}
      tintColor={packedTint(packed)}
    />
  );
}

const groupByCategory = (entries: TripItemEntry[]): CategoryGroup[] => {
  const byCategory = new Map<Category, TripItemEntry[]>();
  for (const entry of entries) {
    const list = byCategory.get(entry.item.category);
    if (list) {
      list.push(entry);
      continue;
    }
    byCategory.set(entry.item.category, [entry]);
  }
  const groups: CategoryGroup[] = [];
  for (const category of CATEGORIES) {
    const list = byCategory.get(category);
    if (!list) continue;
    groups.push({ category, entries: list });
  }
  return groups;
};

const categoryHeading = (group: CategoryGroup): string => {
  const packed = countPacked(group.entries);
  return `${CATEGORY_LABELS[group.category]} (${packed}/${group.entries.length})`;
};

const countPacked = (entries: TripItemEntry[]): number => {
  let count = 0;
  for (const entry of entries) {
    if (entry.packed) count++;
  }
  return count;
};

const rowBorderClass = (packed: boolean): string => {
  if (packed) return "border-line/40 dark:border-line-dark/40 bg-canvas/60 dark:bg-canvas-dark/60";
  return "border-line dark:border-line-dark";
};

const textTone = (packed: boolean): string => {
  if (packed) return "line-through opacity-60";
  return "";
};

const thumbnailOpacity = (faded: boolean): number => {
  if (faded) return 0.5;
  return 1;
};

const itemDisplayName = (item: Item): string => {
  if (item.name) return item.name;
  return CATEGORY_LABELS[item.category];
};

const itemSubline = (item: Item): string => {
  const parts: string[] = [];
  if (item.brand) parts.push(item.brand);
  if (item.colors[0]) parts.push(item.colors[0].hex);
  if (parts.length === 0) return item.category;
  return parts.join(" · ");
};

const thumbnailUri = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};

const packedIcon = (packed: boolean) => {
  if (packed) return "checkmark.circle.fill" as const;
  return "circle" as const;
};

const packedTint = (packed: boolean): string => {
  if (packed) return intentColors.success;
  return intentColors.muted;
};
