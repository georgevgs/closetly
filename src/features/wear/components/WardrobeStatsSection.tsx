import { useMemo } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "~/components/ui/Text";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useItemWearCounts } from "~/features/wear/hooks/useItemWearCounts";
import {
  computeWardrobeStats,
  type AverageCostPerWear,
  type CurrencyTotal,
  type WardrobeStats,
} from "~/features/wear/stats";
import type { Item } from "~/types/items";

export function WardrobeStatsSection({ userId }: { userId: string | undefined }) {
  const { data: items } = useSignedItems(userId);
  const { data: wearCounts } = useItemWearCounts(userId);

  const stats = useMemo(() => {
    if (!items) return null;
    if (!wearCounts) return null;
    return computeWardrobeStats(items, wearCounts);
  }, [items, wearCounts]);

  if (!stats) return null;
  if (stats.totalItems === 0) return null;

  return (
    <View>
      <Text variant="label">Wardrobe insights</Text>
      <View className="mt-3" style={{ gap: 16 }}>
        <TotalsRow stats={stats} />
        <MostWornBlock entries={stats.mostWorn} />
        <NeverWornBlock entries={stats.neverWorn} />
      </View>
    </View>
  );
}

function TotalsRow({ stats }: { stats: WardrobeStats }) {
  return (
    <View className="rounded-xl border border-line dark:border-line-dark p-4">
      <Text variant="caption" className="uppercase tracking-widest">
        Closet
      </Text>
      <Text variant="title">{itemsLabel(stats.totalItems)}</Text>
      <ValueLine values={stats.valuesByCurrency} />
      <CostPerWearLine averages={stats.averageCostPerWear} />
    </View>
  );
}

function ValueLine({ values }: { values: CurrencyTotal[] }) {
  if (values.length === 0) return null;
  return (
    <Text variant="caption" className="mt-2">
      Value: {values.map(formatCurrencyTotal).join(" · ")}
    </Text>
  );
}

function CostPerWearLine({ averages }: { averages: AverageCostPerWear[] }) {
  if (averages.length === 0) return null;
  return (
    <Text variant="caption" className="mt-1">
      Avg cost-per-wear: {averages.map(formatAverageCostPerWear).join(" · ")}
    </Text>
  );
}

function MostWornBlock({
  entries,
}: {
  entries: WardrobeStats["mostWorn"];
}) {
  if (entries.length === 0) {
    return (
      <View>
        <Text variant="label" className="mb-2">
          Most worn
        </Text>
        <Text variant="caption">Log a wear from the Today screen and it shows up here.</Text>
      </View>
    );
  }
  return (
    <View>
      <Text variant="label" className="mb-2">
        Most worn
      </Text>
      <View style={{ gap: 8 }}>
        {entries.map((entry) => (
          <MostWornRow key={entry.item.id} item={entry.item} wears={entry.wears} />
        ))}
      </View>
    </View>
  );
}

function MostWornRow({ item, wears }: { item: Item; wears: number }) {
  return (
    <View className="flex-row items-center rounded-lg border border-line dark:border-line-dark p-2">
      <Thumbnail item={item} />
      <View className="flex-1 ml-3">
        <Text variant="body" numberOfLines={1}>
          {itemDisplayName(item)}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {wearsLabel(wears)}
        </Text>
      </View>
    </View>
  );
}

function NeverWornBlock({
  entries,
}: {
  entries: WardrobeStats["neverWorn"];
}) {
  if (entries.count === 0) return null;
  return (
    <View>
      <Text variant="label" className="mb-2">
        Never worn
      </Text>
      <View className="rounded-lg border border-line dark:border-line-dark p-3">
        <Text variant="body">{neverWornHeading(entries.count)}</Text>
        <View className="flex-row mt-3" style={{ gap: 6 }}>
          {entries.sample.map((item) => (
            <Thumbnail key={item.id} item={item} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Thumbnail({ item }: { item: Item }) {
  return (
    <View
      className="rounded-md overflow-hidden bg-canvas dark:bg-canvas-dark"
      style={{ width: 44, height: 44 }}
    >
      <Image
        source={{ uri: thumbnailUri(item) }}
        style={{ flex: 1 }}
        contentFit="cover"
      />
    </View>
  );
}

const thumbnailUri = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};

const itemDisplayName = (item: Item): string => {
  if (item.name) return item.name;
  return item.category;
};

const itemsLabel = (count: number): string => {
  if (count === 1) return "1 piece";
  return `${count} pieces`;
};

const wearsLabel = (count: number): string => {
  if (count === 1) return "Worn once";
  return `Worn ${count} times`;
};

const neverWornHeading = (count: number): string => {
  if (count === 1) return "1 piece you haven't worn yet.";
  return `${count} pieces you haven't worn yet.`;
};

const formatCurrencyTotal = (entry: CurrencyTotal): string => {
  return `${formatMoney(entry.total)} ${entry.currency}`;
};

const formatAverageCostPerWear = (entry: AverageCostPerWear): string => {
  return `${formatMoney(entry.average)} ${entry.currency}`;
};

const formatMoney = (value: number): string => {
  return value.toFixed(2);
};
