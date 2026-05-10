import { useMemo } from "react";
import { View } from "react-native";
import { Section } from "~/components/ui/Section";
import { SuggestionsList } from "./SuggestionsList";
import { useOutfitActions } from "~/features/outfits/hooks/useOutfitActions";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import { suggestTodayOutfits } from "~/lib/outfit/today";
import type { Item } from "~/types/items";
import type { WeatherSnapshot } from "~/features/weather/useWeather";

const TODAY_OUTFIT_COUNT = 3;

export function TodayOutfitsSection({
  items,
  weather,
  pairAffinity,
  recentlyWornItemIds,
}: {
  items: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity?: Map<string, number>;
  recentlyWornItemIds?: Map<string, number>;
}) {
  const actions = useOutfitActions(weather);

  const suggestions = useMemo(() => {
    return suggestTodayOutfits({
      closet: items,
      weather: toWeatherContext(weather),
      pairAffinity,
      recentlyWornItemIds,
      count: TODAY_OUTFIT_COUNT,
    });
  }, [items, weather, pairAffinity, recentlyWornItemIds]);

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

const subtitleFor = (weather: WeatherSnapshot | null | undefined): string => {
  if (!weather) return "Outfits picked for you.";
  return `${Math.round(weather.tempC)}°C · ${weather.summary}`;
};
