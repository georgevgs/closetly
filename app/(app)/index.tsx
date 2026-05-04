import { View, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import { useMemo } from "react";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useWeather } from "~/features/weather/useWeather";
import { useAuth } from "~/features/auth/context";
import type { Item, Category } from "~/types/items";

const ANCHOR_PRIORITY: Category[] = ["bottom", "outerwear", "dress", "top", "shoes"];

export default function TodayScreen() {
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: weather } = useWeather();

  const anchorCandidates = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      const ai = ANCHOR_PRIORITY.indexOf(a.category);
      const bi = ANCHOR_PRIORITY.indexOf(b.category);
      const aRank = ai === -1 ? 99 : ai;
      const bRank = bi === -1 ? 99 : bi;
      return aRank - bRank;
    });
  }, [items]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 pt-4">
          <Text variant="caption" className="uppercase tracking-widest">
            {greeting()}
            {weather ? ` · ${Math.round(weather.tempC)}°C ${weather.summary}` : ""}
          </Text>
          <Text variant="display" className="mt-1">
            What are we styling today?
          </Text>
        </View>

        {isLoading ? (
          <View className="py-20 items-center">
            <ActivityIndicator />
          </View>
        ) : anchorCandidates.length < 3 ? (
          <ColdStart />
        ) : (
          <Section title="Start with a piece" subtitle="Tap any item to see matching outfits.">
            <ItemRow items={anchorCandidates.slice(0, 12)} />
          </Section>
        )}

        {anchorCandidates.length >= 3 && (
          <Section title="Recently added">
            <ItemRow items={anchorCandidates.slice(-8).reverse()} />
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-8">
      <View className="px-6 mb-3">
        <Text variant="headline">{title}</Text>
        {subtitle && (
          <Text variant="caption" className="mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {children}
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
          <ItemCard
            item={item}
            onPress={() =>
              router.push({
                pathname: "/outfits/suggest",
                params: { anchorId: item.id },
              })
            }
          />
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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}
