import { View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import { useMemo } from "react";

import { Screen } from "~/components/ui/Screen";
import { Section } from "~/components/ui/Section";
import { Text } from "~/components/ui/Text";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useWeather, type WeatherSnapshot } from "~/features/weather/useWeather";
import { useAuth } from "~/features/auth/context";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useRecentWears } from "~/features/wear/hooks/useRecentWears";
import { TodayOutfitsSection } from "~/features/outfits/components/TodayOutfitsSection";
import type { Item, Category } from "~/types/items";

const ANCHOR_PRIORITY: Category[] = ["bottom", "outerwear", "dress", "top", "shoes"];
const MIN_ITEMS_FOR_SUGGESTIONS = 3;

export default function TodayScreen() {
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: weather } = useWeather();
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);

  const anchorCandidates = useMemo(() => {
    if (!items) return [];
    return sortByAnchorPriority(items);
  }, [items]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Greeting weather={weather} />
        <HomeBody
          isLoading={isLoading}
          anchorCandidates={anchorCandidates}
          weather={weather}
          pairAffinity={pairAffinity}
          recentlyWornItemIds={recentlyWornItemIds}
        />
      </ScrollView>
    </Screen>
  );
}

function Greeting({ weather }: { weather: WeatherSnapshot | null | undefined }) {
  return (
    <View className="px-6 pt-4">
      <Text variant="caption" className="uppercase tracking-widest">
        {greetingText()}
        {weatherSuffix(weather)}
      </Text>
      <Text variant="display" className="mt-1">
        What are we styling today?
      </Text>
    </View>
  );
}

function HomeBody({
  isLoading,
  anchorCandidates,
  weather,
  pairAffinity,
  recentlyWornItemIds,
}: {
  isLoading: boolean;
  anchorCandidates: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
}) {
  if (isLoading) return <LoadingState />;
  if (anchorCandidates.length < MIN_ITEMS_FOR_SUGGESTIONS) return <ColdStart />;
  return (
    <ReadyState
      anchorCandidates={anchorCandidates}
      weather={weather}
      pairAffinity={pairAffinity}
      recentlyWornItemIds={recentlyWornItemIds}
    />
  );
}

function LoadingState() {
  return (
    <View className="py-20 items-center">
      <ActivityIndicator />
    </View>
  );
}

function ReadyState({
  anchorCandidates,
  weather,
  pairAffinity,
  recentlyWornItemIds,
}: {
  anchorCandidates: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
}) {
  return (
    <>
      <TodayOutfitsSection
        items={anchorCandidates}
        weather={weather}
        pairAffinity={pairAffinity}
        recentlyWornItemIds={recentlyWornItemIds}
      />
      <Section
        title="Start with a piece"
        subtitle="Or pick your own starting piece for matching outfits."
      >
        <ItemRow items={anchorCandidates.slice(0, 12)} />
      </Section>
      <Section title="Recently added">
        <ItemRow items={anchorCandidates.slice(-8).reverse()} />
      </Section>
    </>
  );
}

function ItemRow({ items }: { items: Item[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
    >
      {items.map((item) => (
        <View key={item.id} style={{ width: 132 }}>
          <ItemCard item={item} onPress={() => openSuggestForAnchor(item.id)} />
        </View>
      ))}
    </ScrollView>
  );
}

function ColdStart() {
  return (
    <View className="px-6 mt-12">
      <View className="rounded-xl border border-line dark:border-line-dark p-6">
        <Text variant="headline" className="mb-2">
          Add at least 3 pieces
        </Text>
        <Text variant="caption" className="mb-4">
          Closetly needs a top, bottom and shoes (or a dress + shoes) to suggest combinations.
        </Text>
        <Pressable
          onPress={() => router.push("/items/new")}
          className="h-12 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
        >
          <Text className="text-canvas dark:text-canvas-dark font-medium">
            Add an item
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const openSuggestForAnchor = (anchorId: string): void => {
  router.push({ pathname: "/outfits/suggest", params: { anchorId } });
};

const sortByAnchorPriority = (items: Item[]): Item[] => {
  return [...items].sort((firstItem, secondItem) => {
    return rankFor(firstItem.category) - rankFor(secondItem.category);
  });
};

const rankFor = (category: Category): number => {
  const index = ANCHOR_PRIORITY.indexOf(category);
  if (index === -1) return 99;
  return index;
};

const weatherSuffix = (weather: WeatherSnapshot | null | undefined): string => {
  if (!weather) return "";
  return ` · ${Math.round(weather.tempC)}°C ${weather.summary}`;
};

const greetingText = (): string => {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Late night";
};
