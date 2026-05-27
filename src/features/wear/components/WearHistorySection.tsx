import { useMemo } from "react";
import { Alert, View } from "react-native";
import { Image } from "expo-image";
import { Text } from "~/components/ui/Text";
import { SwipeToDelete } from "~/components/ui/SwipeToDelete";
import { radii } from "~/lib/designTokens";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useWearHistory, type WearEntry } from "~/features/wear/hooks/useWearHistory";
import { useUndoWear } from "~/features/wear/hooks/useUndoWear";
import { calendarDaysBetween, parseDateOnly } from "~/lib/dates";
import type { Item } from "~/types/items";

const HISTORY_LIMIT = 10;
const THUMBS_PER_ROW = 4;

export function WearHistorySection({ userId }: { userId: string | undefined }) {
  const { data: wears, isLoading } = useWearHistory(userId, HISTORY_LIMIT);
  const { data: items } = useSignedItems(userId);
  const undo = useUndoWear();

  const itemsById = useMemo(() => buildItemMap(items), [items]);

  if (isLoading) return null;
  if (!wears) return null;
  if (wears.length === 0) return null;

  const handleRemove = (wearLogId: string) => {
    Alert.alert("Remove wear?", "This undoes the score nudge for these pieces.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => undo.mutate({ wearLogId }),
      },
    ]);
  };

  return (
    <View>
      <Text variant="label">Recent wears</Text>
      <View className="mt-3" style={{ gap: 8 }}>
        {wears.map((wear) => (
          <WearRow
            key={wear.id}
            wear={wear}
            itemsById={itemsById}
            onRemove={() => handleRemove(wear.id)}
          />
        ))}
      </View>
    </View>
  );
}

function WearRow({
  wear,
  itemsById,
  onRemove,
}: {
  wear: WearEntry;
  itemsById: Map<string, Item>;
  onRemove: () => void;
}) {
  const visibleItems = collectVisibleItems(wear.itemIds, itemsById);

  return (
    <SwipeToDelete onDelete={onRemove} accessibilityLabel="Remove wear">
      <View
        style={{ borderRadius: radii.row, padding: 8 }}
        className="flex-row items-center border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark"
      >
        <View className="flex-row" style={{ gap: 4 }}>
          {visibleItems.map((item) => (
            <Thumbnail key={item.id} item={item} />
          ))}
        </View>
        <View className="flex-1 ml-3">
          <Text variant="body" numberOfLines={1}>
            {formatWornOn(wear.wornOn)}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {weatherSummary(wear)}
          </Text>
        </View>
      </View>
    </SwipeToDelete>
  );
}

function Thumbnail({ item }: { item: Item }) {
  return (
    <View
      className="rounded-md overflow-hidden bg-canvas dark:bg-canvas-dark"
      style={{ width: 40, height: 40 }}
    >
      <Image
        source={{ uri: thumbnailUri(item) }}
        style={{ flex: 1 }}
        contentFit="cover"
      />
    </View>
  );
}

const buildItemMap = (items: Item[] | undefined): Map<string, Item> => {
  const map = new Map<string, Item>();
  if (!items) return map;
  for (const item of items) map.set(item.id, item);
  return map;
};

const collectVisibleItems = (itemIds: string[], itemsById: Map<string, Item>): Item[] => {
  const found: Item[] = [];
  for (const itemId of itemIds) {
    const item = itemsById.get(itemId);
    if (!item) continue;
    found.push(item);
    if (found.length === THUMBS_PER_ROW) break;
  }
  return found;
};

const thumbnailUri = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};

const weatherSummary = (wear: WearEntry): string => {
  if (!wear.weather) return "—";
  return `${Math.round(wear.weather.tempC)}°C · ${wear.weather.summary}`;
};

const formatWornOn = (isoDate: string): string => {
  const worn = parseDateOnly(isoDate);
  const today = new Date();
  const days = calendarDaysBetween(worn, today);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return worn.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

