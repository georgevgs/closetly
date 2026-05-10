import { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager, View } from "react-native";
import { Section } from "~/components/ui/Section";
import { SuggestionsList } from "./SuggestionsList";
import { useOutfitActions } from "~/features/outfits/hooks/useOutfitActions";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import { suggestTodayOutfits } from "~/lib/outfit/today";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";
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
  const { suggestions, isComputing } = useDeferredTodaySuggestions({
    items,
    weather,
    pairAffinity,
    recentlyWornItemIds,
  });

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

// Scoring runs hundreds of combinations per anchor. We defer it to after the
// current interaction so navigation/scroll stays at 60fps; cancellation guards
// against stale results landing if inputs change mid-compute.
const useDeferredTodaySuggestions = ({
  items,
  weather,
  pairAffinity,
  recentlyWornItemIds,
}: {
  items: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
}): { suggestions: OutfitSuggestion[]; isComputing: boolean } => {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isComputing, setIsComputing] = useState(true);

  useEffect(() => {
    setIsComputing(true);
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const computed = suggestTodayOutfits({
        closet: items,
        weather: toWeatherContext(weather),
        pairAffinity,
        recentlyWornItemIds,
        count: TODAY_OUTFIT_COUNT,
      });
      setSuggestions(computed);
      setIsComputing(false);
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, [items, weather, pairAffinity, recentlyWornItemIds]);

  return { suggestions, isComputing };
};

const subtitleFor = (weather: WeatherSnapshot | null | undefined): string => {
  if (!weather) return "Outfits picked for you.";
  return `${Math.round(weather.tempC)}°C · ${weather.summary}`;
};
