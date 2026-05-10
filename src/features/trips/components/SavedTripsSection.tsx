import { Alert, Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import { useTrips, useDeleteTrip, type SavedTrip } from "~/features/trips/hooks/useTrips";
import { parseDateOnly } from "~/lib/dates";

export function SavedTripsSection({ userId }: { userId: string | undefined }) {
  const { data: trips, isLoading } = useTrips(userId);
  const deleteTrip = useDeleteTrip();

  if (isLoading) return null;
  if (!trips || trips.length === 0) return null;

  const confirmDelete = (trip: SavedTrip) => {
    Alert.alert("Delete trip?", `"${trip.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTrip.mutate(trip.id),
      },
    ]);
  };

  return (
    <View className="mt-8">
      <Text variant="label" className="mb-3">
        Saved trips
      </Text>
      <View style={{ gap: 8 }}>
        {trips.map((trip) => (
          <SavedTripRow
            key={trip.id}
            trip={trip}
            onDelete={() => confirmDelete(trip)}
          />
        ))}
      </View>
    </View>
  );
}

function SavedTripRow({
  trip,
  onDelete,
}: {
  trip: SavedTrip;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row items-center rounded-lg border border-line dark:border-line-dark p-3">
      <View className="flex-1">
        <Text variant="body" numberOfLines={1}>
          {trip.name}
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {tripSummary(trip)}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={12} className="px-2">
        <SymbolView name="trash" size={18} tintColor="#a85a3b" />
      </Pressable>
    </View>
  );
}

const tripSummary = (trip: SavedTrip): string => {
  const range = formatRange(trip.startDate, trip.endDate);
  const pieces = `${trip.itemIds.length} pieces`;
  if (!hasTempRange(trip)) return `${range} · ${pieces}`;
  return `${range} · ${tempRange(trip)} · ${pieces}`;
};

const hasTempRange = (trip: SavedTrip): boolean => {
  if (trip.expectedTempMin === null) return false;
  if (trip.expectedTempMax === null) return false;
  return true;
};

const tempRange = (trip: SavedTrip): string => {
  return `${trip.expectedTempMin}–${trip.expectedTempMax}°C`;
};

const formatRange = (startIso: string, endIso: string): string => {
  const start = parseDateOnly(startIso);
  const end = parseDateOnly(endIso);
  const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (startIso === endIso) return startLabel;
  return `${startLabel} – ${endLabel}`;
};
