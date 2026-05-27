import { View, ScrollView, ActivityIndicator, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Screen } from "~/components/ui/Screen";
import { Section } from "~/components/ui/Section";
import { Text } from "~/components/ui/Text";
import { Card } from "~/components/ui/Card";
import { ScreenTitlePill } from "~/components/ui/ScreenTitlePill";
import { intentColors, spacing } from "~/lib/designTokens";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useWeather, type WeatherSnapshot } from "~/features/weather/useWeather";
import { useAuth } from "~/features/auth/context";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useRecentWears } from "~/features/wear/hooks/useRecentWears";
import { useItemWearCounts } from "~/features/wear/hooks/useItemWearCounts";
import {
  usePreferredStyles,
  preferredStylesAsSet,
} from "~/features/profile/stylePreferences";
import { TodayOutfitsSection } from "~/features/outfits/components/TodayOutfitsSection";
import { LocationPrompt } from "~/features/weather/components/LocationPrompt";
import {
  assessClosetViability,
  type ClosetViability,
} from "~/lib/outfit/closetViability";
import type { Item, Category, Style } from "~/types/items";

const ANCHOR_PRIORITY: Category[] = ["bottom", "outerwear", "dress", "top", "shoes"];

const CATEGORY_LABELS: Record<Category, string> = {
  top: "a top",
  bottom: "a bottom",
  dress: "a dress",
  outerwear: "outerwear",
  shoes: "shoes",
  bag: "a bag",
  hat: "a hat",
  accessory: "an accessory",
};

export default function TodayScreen() {
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: weather } = useWeather();
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);
  const { data: itemWearCounts } = useItemWearCounts(session?.user.id);
  const preferredStylesList = usePreferredStyles();
  const preferredStyles = useMemo(
    () => preferredStylesAsSet(preferredStylesList),
    [preferredStylesList],
  );
  const [chromeHeight, setChromeHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setIsRefreshing(false);
  };

  const anchorCandidates = useMemo(() => {
    if (!items) return [];
    return sortByAnchorPriority(items);
  }, [items]);

  const viability = useMemo(() => {
    if (!items) return null;
    return assessClosetViability(items);
  }, [items]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingTop: chromeHeight + spacing.innerGap,
          paddingBottom: insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            progressViewOffset={chromeHeight}
          />
        }
      >
        <Greeting weather={weather} />
        <LocationPrompt />
        <HomeBody
          isLoading={isLoading}
          viability={viability}
          anchorCandidates={anchorCandidates}
          weather={weather}
          pairAffinity={pairAffinity}
          recentlyWornItemIds={recentlyWornItemIds}
          preferredStyles={preferredStyles}
          itemWearCounts={itemWearCounts}
        />
      </ScrollView>
      <View
        pointerEvents="box-none"
        onLayout={(event) => setChromeHeight(event.nativeEvent.layout.height)}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        <View
          className="flex-row items-center"
          style={{
            paddingHorizontal: spacing.screenX,
            paddingTop: spacing.screenY,
            paddingBottom: spacing.innerGap,
          }}
        >
          <ScreenTitlePill label="Today" />
        </View>
      </View>
    </Screen>
  );
}

function Greeting({ weather }: { weather: WeatherSnapshot | null | undefined }) {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, paddingTop: spacing.screenY }}>
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
  viability,
  anchorCandidates,
  weather,
  pairAffinity,
  recentlyWornItemIds,
  preferredStyles,
  itemWearCounts,
}: {
  isLoading: boolean;
  viability: ClosetViability | null;
  anchorCandidates: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
  preferredStyles: ReadonlySet<Style>;
  itemWearCounts: Map<string, number> | undefined;
}) {
  if (isLoading) return <LoadingState />;
  if (!viability) return <LoadingState />;
  if (viability.kind === "empty") return <EmptyCloset />;
  if (viability.kind === "missing") return <IncompleteCloset missing={viability.missing} />;
  return (
    <ReadyState
      anchorCandidates={anchorCandidates}
      weather={weather}
      pairAffinity={pairAffinity}
      recentlyWornItemIds={recentlyWornItemIds}
      preferredStyles={preferredStyles}
      itemWearCounts={itemWearCounts}
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
  preferredStyles,
  itemWearCounts,
}: {
  anchorCandidates: Item[];
  weather: WeatherSnapshot | null | undefined;
  pairAffinity: Map<string, number> | undefined;
  recentlyWornItemIds: Map<string, number> | undefined;
  preferredStyles: ReadonlySet<Style>;
  itemWearCounts: Map<string, number> | undefined;
}) {
  return (
    <>
      <TodayOutfitsSection
        items={anchorCandidates}
        weather={weather}
        pairAffinity={pairAffinity}
        recentlyWornItemIds={recentlyWornItemIds}
        preferredStyles={preferredStyles}
        itemWearCounts={itemWearCounts}
      />
      <BuildOutfitPrompt />
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

function BuildOutfitPrompt() {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, marginTop: spacing.stackMd }}>
      <Pressable onPress={openBuildOutfit}>
        <Card padding="md" className="flex-row items-center">
          <SymbolView name="square.grid.2x2" size={20} tintColor={intentColors.placeholder} />
          <View className="ml-3 flex-1">
            <Text variant="headline">Build it yourself</Text>
            <Text variant="caption" className="mt-0.5">
              Pick a top, bottom and shoes — Closetly scores the combo as you go.
            </Text>
          </View>
          <SymbolView name="chevron.right" size={14} tintColor={intentColors.placeholder} />
        </Card>
      </Pressable>
    </View>
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

function EmptyCloset() {
  return (
    <ColdStartCard
      title="Add your first piece"
      message="Closetly needs a top, bottom and shoes (or a dress + shoes) to suggest combinations."
    />
  );
}

function IncompleteCloset({ missing }: { missing: Category[] }) {
  return (
    <ColdStartCard
      title="Almost there"
      message={`Add ${joinForGuidance(missing)} to start matching outfits.`}
    />
  );
}

function ColdStartCard({ title, message }: { title: string; message: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.screenX, marginTop: 48 }}>
      <Card padding="lg">
        <Text variant="headline" className="mb-2">
          {title}
        </Text>
        <Text variant="caption" className="mb-4">
          {message}
        </Text>
        <Pressable
          onPress={() => router.push("/items/new")}
          className="h-12 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
        >
          <Text className="text-canvas dark:text-canvas-dark font-medium">
            Add an item
          </Text>
        </Pressable>
      </Card>
    </View>
  );
}

const joinForGuidance = (categories: Category[]): string => {
  const labels = categories.map((category) => CATEGORY_LABELS[category]);
  if (labels.length === 0) return "another piece";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  const head = labels.slice(0, -1).join(", ");
  const tail = labels[labels.length - 1];
  return `${head}, and ${tail}`;
};

const openSuggestForAnchor = (anchorId: string): void => {
  router.push({ pathname: "/outfits/suggest", params: { anchorId } });
};

const openBuildOutfit = (): void => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push("/outfits/build");
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
