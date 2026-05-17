import { Alert, ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useColorScheme } from "nativewind";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useTrip, type TripDetail, type TripItemEntry } from "~/features/trips/hooks/useTrip";
import { useToggleTripItemPacked } from "~/features/trips/hooks/useToggleTripItemPacked";
import { useSetAllTripItemsPacked } from "~/features/trips/hooks/useSetAllTripItemsPacked";
import { useDeleteTrip } from "~/features/trips/hooks/useTrips";
import { PackingList } from "~/features/trips/components/PackingList";
import { parseDateOnly } from "~/lib/dates";
import { foregroundFor } from "~/lib/utils";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const togglePacked = useToggleTripItemPacked();
  const setAllPacked = useSetAllTripItemsPacked();
  const deleteTrip = useDeleteTrip();
  const { colorScheme } = useColorScheme();
  const foreground = foregroundFor(colorScheme);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!trip) {
    return (
      <Screen className="items-center justify-center px-6">
        <Text variant="headline">Trip not found</Text>
      </Screen>
    );
  }

  const handleToggle = (entry: TripItemEntry) => {
    togglePacked.mutate({
      tripId: trip.id,
      itemId: entry.item.id,
      packed: !entry.packed,
    });
  };

  const handleDelete = () => {
    Alert.alert("Delete trip?", `"${trip.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          deleteTrip.mutate(trip.id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handlePackAll = () => {
    setAllPacked.mutate({ tripId: trip.id, packed: true });
  };

  const handleUnpackAll = () => {
    setAllPacked.mutate({ tripId: trip.id, packed: false });
  };

  return (
    <Screen edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <EditHeaderButton foreground={foreground} onPress={() => openEditTrip(trip.id)} />
              <DeleteHeaderButton foreground={foreground} onPress={handleDelete} />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60, gap: 20 }}>
        <TripHeaderCard trip={trip} />
        <PackingProgressCard
          items={trip.items}
          onPackAll={handlePackAll}
          onUnpackAll={handleUnpackAll}
        />
        <PackingList entries={trip.items} onToggle={handleToggle} />
      </ScrollView>
    </Screen>
  );
}

type HeaderButtonProps = { foreground: string; onPress: () => void };

function EditHeaderButton({ foreground, onPress }: HeaderButtonProps) {
  return (
    <HeaderIconButton
      symbol="square.and.pencil"
      foreground={foreground}
      onPress={onPress}
      accessibilityLabel="Edit trip"
    />
  );
}

function DeleteHeaderButton({ foreground, onPress }: HeaderButtonProps) {
  return (
    <HeaderIconButton
      symbol="trash"
      foreground={foreground}
      onPress={onPress}
      accessibilityLabel="Delete trip"
    />
  );
}

function HeaderIconButton({
  symbol,
  foreground,
  onPress,
  accessibilityLabel,
}: {
  symbol: Parameters<typeof SymbolView>[0]["name"];
  foreground: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassSurface
        isInteractive
        style={{
          height: 36,
          width: 36,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line/60 dark:border-line-dark/60"
      >
        <SymbolView name={symbol} size={16} tintColor={foreground} weight="semibold" />
      </GlassSurface>
    </Pressable>
  );
}

function TripHeaderCard({ trip }: { trip: TripDetail }) {
  return (
    <GlassSurface
      style={{ borderRadius: 20, padding: 16, overflow: "hidden" }}
      fallbackClassName="bg-canvas dark:bg-canvas-dark border border-line/40 dark:border-line-dark/40 rounded-2xl"
    >
      <Text variant="caption" className="uppercase tracking-widest">
        Trip
      </Text>
      <Text variant="headline">{trip.name}</Text>
      {trip.destination && (
        <Text variant="caption" className="mt-1">
          {trip.destination}
        </Text>
      )}
      <Text variant="caption" className="mt-1">
        {dateRangeLabel(trip)}
      </Text>
      {hasTempRange(trip) && (
        <Text variant="caption" className="mt-0.5">
          Expecting {tempRangeLabel(trip)}
        </Text>
      )}
      {trip.seasons.length > 0 && (
        <Text variant="caption" className="mt-0.5">
          Packed for {trip.seasons.join(", ")}
        </Text>
      )}
      {trip.notes && (
        <Text variant="caption" className="mt-2">
          {trip.notes}
        </Text>
      )}
    </GlassSurface>
  );
}

function PackingProgressCard({
  items,
  onPackAll,
  onUnpackAll,
}: {
  items: TripItemEntry[];
  onPackAll: () => void;
  onUnpackAll: () => void;
}) {
  const packed = countPacked(items);
  const total = items.length;
  return (
    <View className="rounded-xl border border-line dark:border-line-dark p-4">
      <View className="flex-row items-baseline justify-between">
        <Text variant="label">Packing</Text>
        <Text variant="caption">{progressFraction(packed, total)}</Text>
      </View>
      <ProgressBar packed={packed} total={total} />
      <View className="mt-2 flex-row items-center justify-between">
        <Text variant="caption" className="flex-1 pr-2">
          {progressMessage(packed, total)}
        </Text>
        <BatchPackButton
          packedCount={packed}
          totalCount={total}
          onPackAll={onPackAll}
          onUnpackAll={onUnpackAll}
        />
      </View>
    </View>
  );
}

function BatchPackButton({
  packedCount,
  totalCount,
  onPackAll,
  onUnpackAll,
}: {
  packedCount: number;
  totalCount: number;
  onPackAll: () => void;
  onUnpackAll: () => void;
}) {
  if (totalCount === 0) return null;
  const allPacked = packedCount === totalCount;
  const label = batchPackLabel(allPacked);
  const handlePress = batchPackHandler(allPacked, onPackAll, onUnpackAll);
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="px-3 py-1.5 rounded-full border border-line dark:border-line-dark"
    >
      <Text variant="caption">{label}</Text>
    </Pressable>
  );
}

const batchPackLabel = (allPacked: boolean): string => {
  if (allPacked) return "Unpack all";
  return "Pack all";
};

const batchPackHandler = (
  allPacked: boolean,
  onPackAll: () => void,
  onUnpackAll: () => void,
): (() => void) => {
  if (allPacked) return onUnpackAll;
  return onPackAll;
};

function ProgressBar({ packed, total }: { packed: number; total: number }) {
  return (
    <View className="mt-3 h-2 rounded-full bg-line dark:bg-line-dark overflow-hidden">
      <View
        className="h-full bg-ink dark:bg-ink-dark"
        style={{ width: `${progressPercent(packed, total)}%` }}
      />
    </View>
  );
}

const openEditTrip = (tripId: string): void => {
  router.push({ pathname: "/trips/edit/[id]", params: { id: tripId } });
};

const countPacked = (items: TripItemEntry[]): number => {
  let count = 0;
  for (const entry of items) {
    if (entry.packed) count++;
  }
  return count;
};

const progressPercent = (packed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((packed / total) * 100);
};

const progressFraction = (packed: number, total: number): string => {
  return `${packed} / ${total}`;
};

const progressMessage = (packed: number, total: number): string => {
  if (total === 0) return "No pieces in this capsule.";
  if (packed === 0) return "Tap a piece below to mark it packed.";
  if (packed === total) return "All packed — have a good trip.";
  return `${total - packed} pieces left to pack.`;
};

const dateRangeLabel = (trip: TripDetail): string => {
  const start = parseDateOnly(trip.startDate);
  const end = parseDateOnly(trip.endDate);
  const startLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  if (trip.startDate === trip.endDate) return startLabel;
  const endLabel = end.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
};

const hasTempRange = (trip: TripDetail): boolean => {
  if (trip.expectedTempMin === null) return false;
  if (trip.expectedTempMax === null) return false;
  return true;
};

const tempRangeLabel = (trip: TripDetail): string => {
  return `${trip.expectedTempMin}–${trip.expectedTempMax}°C`;
};
