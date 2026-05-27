import { intentColors } from "~/lib/designTokens";
import { TextInput, View } from "react-native";
import { Text } from "~/components/ui/Text";
import { DateField } from "~/components/ui/DateField";
import { AdvancedFilters } from "./AdvancedFilters";
import type { Season } from "~/types/items";

type Props = {
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
};

export function TripPlannerForm({
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
}: Props) {
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
          placeholderTextColor={intentColors.placeholder}
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
          placeholderTextColor={intentColors.placeholder}
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

      <AdvancedFilters
        tempMin={tempMin}
        tempMax={tempMax}
        onChangeTempMin={onChangeTempMin}
        onChangeTempMax={onChangeTempMax}
        seasons={seasons}
        onToggleSeason={onToggleSeason}
      />

      <View>
        <Text variant="label" className="mb-1">
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="Anything to remember while packing"
          placeholderTextColor={intentColors.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="px-4 py-3 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
          style={{ minHeight: 80 }}
        />
      </View>
    </View>
  );
}

const tripDurationLabel = (days: number): string => {
  if (days === 1) return "1 day";
  return `${days} days`;
};
