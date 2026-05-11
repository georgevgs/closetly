import { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useOutfitActions } from "~/features/outfits/hooks/useOutfitActions";
import { useRecentWears } from "~/features/wear/hooks/useRecentWears";
import { useWeather, type WeatherSnapshot } from "~/features/weather/useWeather";
import { suggestOutfits, type OutfitSuggestion } from "~/lib/outfit/combinator";
import {
  SuggestionsList,
  visibleSuggestions,
} from "~/features/outfits/components/SuggestionsList";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import { OCCASIONS, type Item, type Occasion } from "~/types/items";

const SUGGEST_LIMIT = 8;

export default function SuggestScreen() {
  const { anchorId } = useLocalSearchParams<{ anchorId: string }>();
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);
  const { data: weather } = useWeather();
  const actions = useOutfitActions(weather);
  const [targetOccasion, setTargetOccasion] = useState<Occasion | null>(null);

  const anchor = items?.find((item) => item.id === anchorId);
  const { suggestions, isComputing } = useDeferredAnchorSuggestions({
    anchor,
    items,
    weather,
    pairAffinity,
    recentlyWornItemIds,
    targetOccasion,
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

  const visibleCount = visibleSuggestions(suggestions, actions.dismissedKeys).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <AnchorHeader anchor={anchor} weather={weather} />
        <OccasionPicker selected={targetOccasion} onSelect={setTargetOccasion} />
        {!isComputing && (
          <SuggestionCount count={visibleCount} occasion={targetOccasion} />
        )}
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

function SuggestionCount({
  count,
  occasion,
}: {
  count: number;
  occasion: Occasion | null;
}) {
  if (count === 0) return null;
  return (
    <Text variant="caption">{suggestionCountLabel(count, occasion)}</Text>
  );
}

const suggestionCountLabel = (count: number, occasion: Occasion | null): string => {
  const noun = count === 1 ? "outfit" : "outfits";
  if (occasion === null) return `${count} ${noun}`;
  return `${count} ${noun} for ${occasion}`;
};

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

function OccasionPicker({
  selected,
  onSelect,
}: {
  selected: Occasion | null;
  onSelect: (next: Occasion | null) => void;
}) {
  return (
    <View>
      <Text variant="caption" className="uppercase tracking-widest mb-2">
        Occasion
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <Pill
          label="Any"
          selected={selected === null}
          onPress={() => onSelect(null)}
        />
        {OCCASIONS.map((occasion) => (
          <Pill
            key={occasion}
            label={occasion}
            selected={selected === occasion}
            onPress={() => onSelect(occasion)}
          />
        ))}
      </ScrollView>
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
  targetOccasion,
}: {
  anchor: Item | undefined;
  items: Item[] | undefined;
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
  targetOccasion: Occasion | null;
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
        targetOccasion: occasionOrUndefined(targetOccasion),
        limit: SUGGEST_LIMIT,
      });
      setSuggestions(computed);
      setIsComputing(false);
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, [anchor, items, weather, pairAffinity, recentlyWornItemIds, targetOccasion]);

  return { suggestions, isComputing };
};

const occasionOrUndefined = (occasion: Occasion | null): Occasion | undefined => {
  if (occasion === null) return undefined;
  return occasion;
};

const anchorTitle = (item: Item): string => {
  if (item.name) return item.name;
  return item.category;
};
