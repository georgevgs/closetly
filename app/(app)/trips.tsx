import { useMemo, useState } from "react";
import { View, ScrollView, TextInput } from "react-native";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { Button } from "~/components/ui/Button";
import { DateField } from "~/components/ui/DateField";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { buildCapsule, type Capsule } from "~/features/trips/capsule";
import { useCreateTrip } from "~/features/trips/hooks/useTrips";
import { SavedTripsSection } from "~/features/trips/components/SavedTripsSection";
import { calendarDaysBetween } from "~/lib/dates";
import { SEASONS, type Season } from "~/types/items";

const DEFAULT_TRIP_LENGTH_DAYS = 5;
const DEFAULT_TEMP_MIN = "12";
const DEFAULT_TEMP_MAX = "22";

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
  const [generated, setGenerated] = useState(false);

  const numericDays = inclusiveDaysBetween(startDate, endDate);
  const numericTempMin = parseInputNumber(tempMin, 0);
  const numericTempMax = parseInputNumber(tempMax, 25);

  const capsule = useMemo(() => {
    if (!items || !generated) return null;
    return buildCapsule({
      closet: items,
      days: numericDays,
      tempMinC: numericTempMin,
      tempMaxC: numericTempMax,
      seasons: [...seasons],
    });
  }, [items, generated, numericDays, numericTempMin, numericTempMax, seasons]);

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
    const next = new Set(seasons);
    if (next.has(season)) next.delete(season);
    else next.add(season);
    setSeasons(next);
  };

  const saveTrip = () => {
    if (!capsule) return;
    if (capsule.items.length === 0) {
      toast.error("Capsule is empty — adjust the filters.");
      return;
    }
    const tripName = name.trim();
    if (tripName.length === 0) {
      toast.error("Give your trip a name to save it.");
      return;
    }
    createTrip.mutate(
      {
        name: tripName,
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
          setGenerated(false);
        },
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <View className="pt-4">
          <Text variant="display">Trips</Text>
          <Text variant="caption" className="mt-1">
            Pack a capsule that mixes and matches.
          </Text>
        </View>

        <SavedTripsSection userId={session?.user.id} />

        <PlannerForm
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
          onBuild={() => setGenerated(true)}
        />

        {capsule && (
          <CapsulePreview
            capsule={capsule}
            saving={createTrip.isPending}
            onSave={saveTrip}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function PlannerForm({
  name,
  onChangeName,
  destination,
  onChangeDestination,
  notes,
  onChangeNotes,
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  numericDays,
  tempMin,
  onChangeTempMin,
  tempMax,
  onChangeTempMax,
  seasons,
  onToggleSeason,
  onBuild,
}: {
  name: string;
  onChangeName: (value: string) => void;
  destination: string;
  onChangeDestination: (value: string) => void;
  notes: string;
  onChangeNotes: (value: string) => void;
  startDate: Date;
  endDate: Date;
  onChangeStartDate: (next: Date) => void;
  onChangeEndDate: (next: Date) => void;
  numericDays: number;
  tempMin: string;
  onChangeTempMin: (value: string) => void;
  tempMax: string;
  onChangeTempMax: (value: string) => void;
  seasons: Set<Season>;
  onToggleSeason: (season: Season) => void;
  onBuild: () => void;
}) {
  return (
    <View className="mt-8 gap-4">
      <View>
        <Text variant="label" className="mb-1">
          Trip name
        </Text>
        <TextInput
          value={name}
          onChangeText={onChangeName}
          placeholder="e.g. Lisbon weekend"
          placeholderTextColor="#a8a29e"
          className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        />
      </View>

      <View>
        <Text variant="label" className="mb-1">
          Destination (optional)
        </Text>
        <TextInput
          value={destination}
          onChangeText={onChangeDestination}
          placeholder="e.g. Lisbon, Portugal"
          placeholderTextColor="#a8a29e"
          className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        />
      </View>

      <View className="flex-row gap-3">
        <DateField label="Start" value={startDate} onChange={onChangeStartDate} />
        <DateField
          label="End"
          value={endDate}
          onChange={onChangeEndDate}
          minimumDate={startDate}
        />
      </View>
      <Text variant="caption">{tripDurationLabel(numericDays)}</Text>

      <View className="flex-row gap-3">
        <NumberField label="Min °C" value={tempMin} onChange={onChangeTempMin} />
        <NumberField label="Max °C" value={tempMax} onChange={onChangeTempMax} />
      </View>

      <View>
        <Text variant="label" className="mb-2">
          Seasons
        </Text>
        <View className="flex-row gap-2">
          {SEASONS.map((season) => (
            <Pill
              key={season}
              label={season}
              selected={seasons.has(season)}
              onPress={() => onToggleSeason(season)}
            />
          ))}
        </View>
      </View>

      <View>
        <Text variant="label" className="mb-1">
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="Anything to remember while packing"
          placeholderTextColor="#a8a29e"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="px-4 py-3 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          style={{ minHeight: 80 }}
        />
      </View>

      <Button label="Build capsule" onPress={onBuild} />
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-1">
      <Text variant="label" className="mb-1">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
        className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
      />
    </View>
  );
}

function CapsulePreview({
  capsule,
  saving,
  onSave,
}: {
  capsule: Capsule;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <View className="mt-8 gap-4">
      <View className="rounded-xl border border-line dark:border-line-dark p-4">
        <Text variant="caption" className="uppercase tracking-widest">
          Capsule
        </Text>
        <Text variant="title">{capsule.itemCount} pieces</Text>
        <Text variant="caption" className="mt-1">
          Picked for color and style fit across the slots below.
        </Text>
      </View>

      {Object.entries(capsule.byCategory).map(([category, list]) => {
        if (list.length === 0) return null;
        return (
          <CategoryRow key={category} category={category} items={list} />
        );
      })}

      <Button label="Save trip" onPress={onSave} loading={saving} size="lg" />
    </View>
  );
}

function CategoryRow({
  category,
  items,
}: {
  category: string;
  items: Capsule["byCategory"][keyof Capsule["byCategory"]];
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        {category} ({items.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {items.map((item) => (
          <View key={item.id} style={{ width: 110 }}>
            <ItemCard item={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

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

const tripDurationLabel = (days: number): string => {
  if (days === 1) return "1 day";
  return `${days} days`;
};
