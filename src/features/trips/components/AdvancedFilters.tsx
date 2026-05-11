import { useState } from "react";
import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { NumberField } from "./NumberField";
import { SEASONS, type Season } from "~/types/items";

type Props = {
  tempMin: string;
  tempMax: string;
  onChangeTempMin: (value: string) => void;
  onChangeTempMax: (value: string) => void;
  seasons: Set<Season>;
  onToggleSeason: (season: Season) => void;
};

export function AdvancedFilters({
  tempMin,
  tempMax,
  onChangeTempMin,
  onChangeTempMax,
  seasons,
  onToggleSeason,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="rounded-lg border border-line dark:border-line-dark">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={
          expanded ? "Hide advanced filters" : "Show advanced filters"
        }
        className="flex-row items-center justify-between px-4 h-12"
      >
        <View>
          <Text variant="label">Filters</Text>
          <Text variant="caption" className="mt-0.5">
            {filterSummary({ tempMin, tempMax, seasons })}
          </Text>
        </View>
        <SymbolView
          name={expanded ? "chevron.up" : "chevron.down"}
          size={14}
          tintColor="#a8a29e"
        />
      </Pressable>

      {expanded && (
        <View className="px-4 pb-4 gap-4">
          <View className="flex-row gap-3">
            <NumberField label="Min °C" value={tempMin} onChange={onChangeTempMin} />
            <NumberField label="Max °C" value={tempMax} onChange={onChangeTempMax} />
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
                  onPress={() => onToggleSeason(season)}
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const filterSummary = ({
  tempMin,
  tempMax,
  seasons,
}: {
  tempMin: string;
  tempMax: string;
  seasons: Set<Season>;
}): string => {
  const tempLabel = `${tempMin}–${tempMax}°C`;
  if (seasons.size === 0) return `${tempLabel} · any season`;
  return `${tempLabel} · ${[...seasons].join(", ")}`;
};
