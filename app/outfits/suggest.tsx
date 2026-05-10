import { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager, ScrollView, View } from "react-native";
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
import { suggestOutfits, type OutfitSuggestion } from "~/lib/outfit/combinator";
import { SuggestionsList } from "~/features/outfits/components/SuggestionsList";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import type { Item } from "~/types/items";

const SUGGEST_LIMIT = 8;

export default function SuggestScreen() {
  const { anchorId } = useLocalSearchParams<{ anchorId: string }>();
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);
  const { data: weather } = useWeather();
  const actions = useOutfitActions(weather);

  const anchor = items?.find((item) => item.id === anchorId);
  const { suggestions, isComputing } = useDeferredAnchorSuggestions({
    anchor,
    items,
    weather,
    pairAffinity,
    recentlyWornItemIds,
  });

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
        {isComputing && <ComputingState />}
        {!isComputing && (
          <SuggestionsList
            suggestions={suggestions}
            savedKeys={actions.savedKeys}
            wornKeys={actions.wornKeys}
            dismissedKeys={actions.dismissedKeys}
            onSave={actions.handleSave}
            onWear={actions.handleWear}
            onDismiss={actions.handleDismiss}
          />
        )}
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

function ComputingState() {
  return (
    <View className="py-10 items-center">
      <ActivityIndicator />
    </View>
  );
}

// Same deferral pattern as the Today screen — the combinator can score
// hundreds of outfits per anchor and would otherwise stall the navigation
// transition into this screen.
const useDeferredAnchorSuggestions = ({
  anchor,
  items,
  weather,
  pairAffinity,
  recentlyWornItemIds,
}: {
  anchor: Item | undefined;
  items: Item[] | undefined;
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
}): { suggestions: OutfitSuggestion[]; isComputing: boolean } => {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isComputing, setIsComputing] = useState(true);

  useEffect(() => {
    if (!anchor || !items) {
      setSuggestions([]);
      setIsComputing(false);
      return;
    }
    setIsComputing(true);
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const computed = suggestOutfits({
        anchor,
        closet: items,
        weather: toWeatherContext(weather),
        pairAffinity,
        recentlyWornItemIds,
        limit: SUGGEST_LIMIT,
      });
      setSuggestions(computed);
      setIsComputing(false);
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, [anchor, items, weather, pairAffinity, recentlyWornItemIds]);

  return { suggestions, isComputing };
};

const anchorTitle = (item: Item): string => {
  if (item.name) return item.name;
  return item.category;
};
