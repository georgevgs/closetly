import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { DateField } from "~/components/ui/DateField";
import { NumberField } from "~/features/trips/components/NumberField";
import { EditTripBar } from "~/features/trips/components/EditTripBar";
import { useTrip, type TripDetail } from "~/features/trips/hooks/useTrip";
import { useUpdateTrip } from "~/features/trips/hooks/useTrips";
import { parseDateOnly } from "~/lib/dates";
import { SEASONS, type Season } from "~/types/items";

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const updateTrip = useUpdateTrip();

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState<Date>(() => atMidnight(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => atMidnight(new Date()));
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");
  const [seasons, setSeasons] = useState<Set<Season>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!trip || hydrated) return;
    hydrateFromTrip(trip, {
      setName,
      setDestination,
      setNotes,
      setStartDate,
      setEndDate,
      setTempMin,
      setTempMax,
      setSeasons,
    });
    setHydrated(true);
  }, [trip, hydrated]);

  const toggleSeason = (season: Season) => {
    const nextSeasons = new Set(seasons);
    if (nextSeasons.has(season)) nextSeasons.delete(season);
    else nextSeasons.add(season);
    setSeasons(nextSeasons);
  };

  const numericTempMin = useMemo(() => parseTempInput(tempMin, 0), [tempMin]);
  const numericTempMax = useMemo(() => parseTempInput(tempMax, 25), [tempMax]);

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

  const trimmedName = name.trim();
  const blockedReason = blockedReasonFor({
    trimmedName,
    numericTempMin,
    numericTempMax,
  });

  if (isLoading || !trip) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  const onSave = () => {
    if (blockedReason !== null) return;
    updateTrip.mutate(
      {
        id: trip.id,
        name: trimmedName,
        startDate,
        endDate,
        expectedTempMin: numericTempMin,
        expectedTempMax: numericTempMax,
        destination: trimmedOrNull(destination),
        notes: trimmedOrNull(notes),
        seasons: [...seasons],
      },
      {
        onSuccess: () => {
          toast.success("Trip updated");
          router.back();
        },
      },
    );
  };

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20 }}>
        <Field label="Trip name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lisbon weekend"
            placeholderTextColor="#a8a29e"
            className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          />
        </Field>

        <Field label="Destination (optional)">
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Lisbon, Portugal"
            placeholderTextColor="#a8a29e"
            className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          />
        </Field>

        <View className="flex-row gap-3">
          <DateField label="Start" value={startDate} onChange={updateStartDate} />
          <DateField
            label="End"
            value={endDate}
            onChange={updateEndDate}
            minimumDate={startDate}
          />
        </View>

        <View className="flex-row gap-3">
          <NumberField label="Min °C" value={tempMin} onChange={setTempMin} />
          <NumberField label="Max °C" value={tempMax} onChange={setTempMax} />
        </View>

        <View>
          <Text variant="label" className="mb-2">
            Seasons
          </Text>
          <View className="flex-row gap-2 flex-wrap">
            {SEASONS.map((season) => (
              <Pill
                key={season}
                label={season}
                selected={seasons.has(season)}
                onPress={() => toggleSeason(season)}
              />
            ))}
          </View>
        </View>

        <Field label="Notes (optional)">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to remember while packing"
            placeholderTextColor="#a8a29e"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="px-4 py-3 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
            style={{ minHeight: 80 }}
          />
        </Field>
      </ScrollView>

      <EditTripBar
        onSave={onSave}
        saving={updateTrip.isPending}
        hint={blockedReason}
      />
    </Screen>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      {children}
    </View>
  );
}

const blockedReasonFor = ({
  trimmedName,
  numericTempMin,
  numericTempMax,
}: {
  trimmedName: string;
  numericTempMin: number;
  numericTempMax: number;
}): string | null => {
  if (trimmedName.length === 0) return "Add a trip name";
  if (numericTempMin > numericTempMax) return "Min °C must be at or below Max °C";
  return null;
};

type Setters = {
  setName: (next: string) => void;
  setDestination: (next: string) => void;
  setNotes: (next: string) => void;
  setStartDate: (next: Date) => void;
  setEndDate: (next: Date) => void;
  setTempMin: (next: string) => void;
  setTempMax: (next: string) => void;
  setSeasons: (next: Set<Season>) => void;
};

const hydrateFromTrip = (trip: TripDetail, setters: Setters): void => {
  setters.setName(trip.name);
  setters.setDestination(stringOrEmpty(trip.destination));
  setters.setNotes(stringOrEmpty(trip.notes));
  setters.setStartDate(parseDateOnly(trip.startDate));
  setters.setEndDate(parseDateOnly(trip.endDate));
  setters.setTempMin(numberToInput(trip.expectedTempMin));
  setters.setTempMax(numberToInput(trip.expectedTempMax));
  setters.setSeasons(new Set(trip.seasons));
};

const stringOrEmpty = (value: string | null): string => {
  if (value === null) return "";
  return value;
};

const numberToInput = (value: number | null): string => {
  if (value === null) return "";
  return String(value);
};

const parseTempInput = (raw: string, fallback: number): number => {
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
