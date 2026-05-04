import { useMemo, useState } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useSaveOutfit } from "~/features/outfits/hooks/useSaveOutfit";
import { useWeather } from "~/features/weather/useWeather";
import { suggestOutfits } from "~/lib/outfit/combinator";
import { OutfitCard } from "~/features/outfits/components/OutfitCard";

export default function SuggestScreen() {
  const { anchorId } = useLocalSearchParams<{ anchorId: string }>();
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: weather } = useWeather();
  const save = useSaveOutfit();
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const anchor = items?.find((i) => i.id === anchorId);

  const suggestions = useMemo(() => {
    if (!anchor || !items) return [];
    return suggestOutfits({
      anchor,
      closet: items,
      weather: weather
        ? { tempC: weather.tempC, precip: weather.precipProb > 0.4 }
        : undefined,
      pairAffinity,
      limit: 8,
    });
  }, [anchor, items, pairAffinity, weather]);

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
        <GlassSurface
          style={{ borderRadius: 20, padding: 16, overflow: "hidden" }}
          fallbackClassName="bg-canvas dark:bg-canvas-dark border border-line/40 dark:border-line-dark/40 rounded-2xl"
        >
          <Text variant="caption" className="uppercase tracking-widest">
            Anchored to
          </Text>
          <Text variant="headline">{anchor.name ?? anchor.category}</Text>
          {weather && (
            <Text variant="caption" className="mt-1">
              {Math.round(weather.tempC)}°C · {weather.summary}
            </Text>
          )}
        </GlassSurface>
        {suggestions.length === 0 ? (
          <View className="px-2 py-8">
            <Text variant="body">
              Not enough matching pieces yet — add items from a different category.
            </Text>
          </View>
        ) : (
          suggestions.map((s) => {
            const key = s.items
              .map((i) => i.id)
              .sort()
              .join("|");
            return (
              <OutfitCard
                key={key}
                outfit={s}
                saved={savedKeys.has(key)}
                onSave={async () => {
                  if (savedKeys.has(key)) return;
                  await save.mutateAsync({ items: s.items, favorite: true, rating: 5 });
                  setSavedKeys((prev) => new Set(prev).add(key));
                  toast.success("Saved to favorites");
                }}
              />
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
