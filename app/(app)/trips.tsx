import { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { buildCapsule } from "~/features/trips/capsule";
import { useCreateTrip } from "~/features/trips/hooks/useTrips";
import { SavedTripsSection } from "~/features/trips/components/SavedTripsSection";
import { TripPlannerForm } from "~/features/trips/components/TripPlannerForm";
import { CapsulePreview } from "~/features/trips/components/CapsulePreview";
import { SaveTripBar } from "~/features/trips/components/SaveTripBar";
import { useDebouncedValue } from "~/hooks/useDebouncedValue";
import { calendarDaysBetween } from "~/lib/dates";
import { type Season } from "~/types/items";

const DEFAULT_TRIP_LENGTH_DAYS = 5;
const DEFAULT_TEMP_MIN = "12";
const DEFAULT_TEMP_MAX = "22";
const TEMP_DEBOUNCE_MS = 150;

export default function TripsScreen() {
  const { session } = useAuth();
  const { data: items } = useSignedItems(session?.user.id);
  const createTrip = useCreateTrip();

  const initialStart = useMemo(() => atMidnight(new Date()), []);
  const initialEnd = useMemo(
    () => addDays(initialStart, DEFAULT_TRIP_LENGTH_DAYS - 1),
    [initialStart],
  );

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);
  const [tempMin, setTempMin] = useState(DEFAULT_TEMP_MIN);
  const [tempMax, setTempMax] = useState(DEFAULT_TEMP_MAX);
  const [seasons, setSeasons] = useState<Set<Season>>(
    new Set(["spring", "autumn"]),
  );

  const debouncedTempMin = useDebouncedValue(tempMin, TEMP_DEBOUNCE_MS);
  const debouncedTempMax = useDebouncedValue(tempMax, TEMP_DEBOUNCE_MS);

  const numericDays = inclusiveDaysBetween(startDate, endDate);
  const numericTempMin = parseInputNumber(debouncedTempMin, 0);
  const numericTempMax = parseInputNumber(debouncedTempMax, 25);

  const capsule = useMemo(() => {
    if (!items) return null;
    return buildCapsule({
      closet: items,
      days: numericDays,
      tempMinC: numericTempMin,
      tempMaxC: numericTempMax,
      seasons: [...seasons],
    });
  }, [items, numericDays, numericTempMin, numericTempMax, seasons]);

  const updateStartDate = (next: Date) => {
    setStartDate(next);
    if (endDate < next) setEndDate(next);
  };

  const updateEndDate = (next: Date) => {
    if (next < startDate) {
      setEndDate(startDate);
      return;
    }
    setEndDate(next);
  };

  const toggleSeason = (season: Season) => {
    const nextSeasons = new Set(seasons);
    if (nextSeasons.has(season)) nextSeasons.delete(season);
    else nextSeasons.add(season);
    setSeasons(nextSeasons);
  };

  const trimmedName = name.trim();
  const itemCount = capsuleItemCount(capsule);
  const saveBlockedReason = blockedReason({ trimmedName, itemCount });

  const saveTrip = () => {
    if (!capsule) return;
    if (saveBlockedReason !== null) return;
    createTrip.mutate(
      {
        name: trimmedName,
        startDate,
        endDate,
        expectedTempMin: numericTempMin,
        expectedTempMax: numericTempMax,
        destination: trimmedOrNull(destination),
        notes: trimmedOrNull(notes),
        seasons: [...seasons],
        items: capsule.items,
      },
      {
        onSuccess: () => {
          toast.success("Trip saved");
          setName("");
          setDestination("");
          setNotes("");
        },
      },
    );
  };

  return (
    <Screen edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-4">
          <Text variant="display">Trips</Text>
          <Text variant="caption" className="mt-1">
            Pack a capsule that mixes and matches.
          </Text>
        </View>

        <SavedTripsSection userId={session?.user.id} />

        <TripPlannerForm
          name={name}
          onChangeName={setName}
          destination={destination}
          onChangeDestination={setDestination}
          notes={notes}
          onChangeNotes={setNotes}
          startDate={startDate}
          endDate={endDate}
          onChangeStartDate={updateStartDate}
          onChangeEndDate={updateEndDate}
          numericDays={numericDays}
          tempMin={tempMin}
          onChangeTempMin={setTempMin}
          tempMax={tempMax}
          onChangeTempMax={setTempMax}
          seasons={seasons}
          onToggleSeason={toggleSeason}
        />

        {capsule && <CapsulePreview capsule={capsule} />}
      </ScrollView>

      <SaveTripBar
        onSave={saveTrip}
        saving={createTrip.isPending}
        disabled={saveBlockedReason !== null}
        hint={saveBlockedReason}
        itemCount={itemCount}
      />
    </Screen>
  );
}

const capsuleItemCount = (
  capsule: ReturnType<typeof buildCapsule> | null,
): number => {
  if (!capsule) return 0;
  return capsule.itemCount;
};

const blockedReason = ({
  trimmedName,
  itemCount,
}: {
  trimmedName: string;
  itemCount: number;
}): string | null => {
  if (trimmedName.length === 0) return "Add a name to save";
  if (itemCount === 0) return "Widen filters to fill the capsule";
  return null;
};

const parseInputNumber = (raw: string, fallback: number): number => {
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

const trimmedOrNull = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
};

const atMidnight = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// Inclusive — a trip starting and ending on the same day is one day.
const inclusiveDaysBetween = (start: Date, end: Date): number => {
  const diff = calendarDaysBetween(start, end);
  if (diff < 0) return 1;
  return diff + 1;
};
