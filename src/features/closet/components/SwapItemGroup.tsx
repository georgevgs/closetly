import { View } from "react-native";

import { Text } from "~/components/ui/Text";
import { SwapItemTile } from "~/features/closet/components/SwapItemTile";
import { spacing } from "~/lib/designTokens";
import type { Item } from "~/types/items";

type Props = {
  title: string;
  subtitle: string;
  items: Item[];
  skippedIds: ReadonlySet<string>;
  unwornIds: ReadonlySet<string>;
  onToggleItem: (item: Item) => void;
};

const TILE_GAP = 8;

export function SwapItemGroup({
  title,
  subtitle,
  items,
  skippedIds,
  unwornIds,
  onToggleItem,
}: Props) {
  if (items.length === 0) return null;
  const selectedCount = items.filter((item) => !skippedIds.has(item.id)).length;
  return (
    <View style={{ paddingHorizontal: spacing.screenX, marginTop: spacing.stackMd }}>
      <View className="flex-row items-baseline justify-between">
        <Text variant="label">{title}</Text>
        <Text variant="caption">{`${selectedCount} of ${items.length}`}</Text>
      </View>
      <Text variant="caption" className="mt-1 mb-3">
        {subtitle}
      </Text>
      <UnwornHint count={countUnworn(items, unwornIds)} />
      <View className="flex-row flex-wrap" style={{ margin: -TILE_GAP / 2 }}>
        {items.map((item) => (
          <View key={item.id} style={{ width: "33.333%", padding: TILE_GAP / 2 }}>
            <SwapItemTile
              item={item}
              selected={!skippedIds.has(item.id)}
              unworn={unwornIds.has(item.id)}
              onToggle={onToggleItem}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function UnwornHint({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Text variant="caption" className="mb-3">
      {unwornHintText(count)}
    </Text>
  );
}

const countUnworn = (items: Item[], unwornIds: ReadonlySet<string>): number => {
  return items.filter((item) => unwornIds.has(item.id)).length;
};

const unwornHintText = (count: number): string => {
  if (count === 1) return "One of these wasn't worn at all — maybe donate it instead of storing it.";
  return `${count} of these weren't worn at all — maybe donate them instead of storing them.`;
};
