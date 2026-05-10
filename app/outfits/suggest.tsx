import { useMemo } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useOutfitActions } from "~/features/outfits/hooks/useOutfitActions";
import { useRecentWears } from "~/features/wear/hooks/useRecentWears";
import { useWeather, type WeatherSnapshot } from "~/features/weather/useWeather";
import { suggestOutfits } from "~/lib/outfit/combinator";
import { SuggestionsList } from "~/features/outfits/components/SuggestionsList";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import type { Item } from "~/types/items";

export default function SuggestScreen() {
  const { anchorId } = useLocalSearchParams<{ anchorId: string }>();
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);
  const { data: weather } = useWeather();
  const actions = useOutfitActions(weather);

  const anchor = items?.find((item) => item.id === anchorId);

  const suggestions = useMemo(() => {
    if (!anchor || !items) return [];
    return suggestOutfits({
      anchor,
      closet: items,
      weather: toWeatherContext(weather),
      pairAffinity,
      recentlyWornItemIds,
      limit: 8,
    });
  }, [anchor, items, pairAffinity, recentlyWornItemIds, weather]);

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!anchor) {
    return (
      <Screen className="items-center justify-center px-6">
        <Text variant="headline">Item not found</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <AnchorHeader anchor={anchor} weather={weather} />
        <SuggestionsList
          suggestions={suggestions}
          savedKeys={actions.savedKeys}
          wornKeys={actions.wornKeys}
          dismissedKeys={actions.dismissedKeys}
          onSave={actions.handleSave}
          onWear={actions.handleWear}
          onDismiss={actions.handleDismiss}
        />
      </ScrollView>
    </Screen>
  );
}

function AnchorHeader({
  anchor,
  weather,
}: {
  anchor: Item;
  weather: WeatherSnapshot | null | undefined;
}) {
  return (
    <GlassSurface
      style={{ borderRadius: 20, padding: 16, overflow: "hidden" }}
      fallbackClassName="bg-canvas dark:bg-canvas-dark border border-line/40 dark:border-line-dark/40 rounded-2xl"
    >
      <Text variant="caption" className="uppercase tracking-widest">
        Anchored to
      </Text>
      <Text variant="headline">{anchorTitle(anchor)}</Text>
      {weather && (
        <Text variant="caption" className="mt-1">
          {Math.round(weather.tempC)}°C · {weather.summary}
        </Text>
      )}
    </GlassSurface>
  );
}

const anchorTitle = (item: Item): string => {
  if (item.name) return item.name;
  return item.category;
};
