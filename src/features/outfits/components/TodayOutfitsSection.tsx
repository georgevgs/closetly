import { ActivityIndicator, View } from "react-native";
import { Section } from "~/components/ui/Section";
import { SuggestionsList } from "./SuggestionsList";
import { useOutfitActions } from "~/features/outfits/hooks/useOutfitActions";
import { useDeferredSuggestions } from "~/features/outfits/hooks/useDeferredSuggestions";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import { suggestTodayOutfits } from "~/lib/outfit/today";
import type { Item, Style } from "~/types/items";
import type { WeatherSnapshot } from "~/features/weather/useWeather";

const TODAY_OUTFIT_COUNT = 3;

export function TodayOutfitsSection({
  items,
  weather,
  pairAffinity,
  recentlyWornItemIds,
  preferredStyles,
  itemWearCounts,
}: {
  items: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
  preferredStyles?: ReadonlySet<Style>;
  itemWearCounts?: Map<string, number>;
}) {
  const actions = useOutfitActions(weather);
  const { suggestions, isComputing } = useDeferredSuggestions(
    { items, weather, pairAffinity, recentlyWornItemIds, preferredStyles, itemWearCounts },
    computeTodaySuggestions,
    [items, weather, pairAffinity, recentlyWornItemIds, preferredStyles, itemWearCounts],
  );

  if (isComputing) return <ComputingPlaceholder />;
  if (suggestions.length === 0) return null;

  return (
    <Section title="For today" subtitle={subtitleFor(weather)}>
      <View className="px-4" style={{ gap: 12 }}>
        <SuggestionsList
          suggestions={suggestions}
          savedKeys={actions.savedKeys}
          wornKeys={actions.wornKeys}
          dismissedKeys={actions.dismissedKeys}
          onSave={actions.handleSave}
          onWear={actions.handleWear}
          onDismiss={actions.handleDismiss}
        />
      </View>
    </Section>
  );
}

function ComputingPlaceholder() {
  return (
    <Section title="For today" subtitle="Pulling outfits…">
      <View className="px-4 py-6 items-center">
        <ActivityIndicator />
      </View>
    </Section>
  );
}

type TodaySuggestionInputs = {
  items: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
  preferredStyles: ReadonlySet<Style> | undefined;
  itemWearCounts: Map<string, number> | undefined;
};

const computeTodaySuggestions = (inputs: TodaySuggestionInputs) => {
  return suggestTodayOutfits({
    closet: inputs.items,
    weather: toWeatherContext(inputs.weather),
    pairAffinity: inputs.pairAffinity,
    recentlyWornItemIds: inputs.recentlyWornItemIds,
    preferredStyles: inputs.preferredStyles,
    itemWearCounts: inputs.itemWearCounts,
    count: TODAY_OUTFIT_COUNT,
  });
};

const subtitleFor = (weather: WeatherSnapshot | null | undefined): string => {
  if (!weather) return "Outfits picked for you.";
  return `${Math.round(weather.tempC)}°C · ${weather.summary}`;
};
