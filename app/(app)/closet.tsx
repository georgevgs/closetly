import { useMemo, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useAuth } from "~/features/auth/context";
import { CATEGORIES, type Category } from "~/types/items";

const CATEGORY_LABELS: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bags",
  hat: "Hats",
  accessory: "Accessories",
};

const SORT_MODES = ["newest", "oldest", "category"] as const;
type SortMode = (typeof SORT_MODES)[number];
const SORT_LABEL: Record<SortMode, string> = {
  newest: "Newest",
  oldest: "Oldest",
  category: "Category",
};

export default function ClosetScreen() {
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const { colorScheme } = useColorScheme();
  const fg = colorScheme === "dark" ? "#f5f3ef" : "#1a1a1a";

  const sorted = useMemo(() => {
    if (!items) return [];
    const base = filter === "all" ? items : items.filter((i) => i.category === filter);
    const arr = [...base];
    if (sort === "newest") {
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (sort === "oldest") {
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    } else {
      arr.sort((a, b) => {
        const ci = CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
        return ci !== 0 ? ci : b.created_at.localeCompare(a.created_at);
      });
    }
    return arr;
  }, [items, filter, sort]);

  const cycleSort = () => {
    Haptics.selectionAsync();
    const i = SORT_MODES.indexOf(sort);
    setSort(SORT_MODES[(i + 1) % SORT_MODES.length]);
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
        <Text variant="display">Closet</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={cycleSort}
            hitSlop={8}
            className="flex-row items-center gap-1.5 h-9 px-3 rounded-full border border-line dark:border-line-dark"
          >
            <SymbolView name="arrow.up.arrow.down" size={11} tintColor={fg} />
            <Text variant="caption" className="text-ink dark:text-ink-dark">
              {SORT_LABEL[sort]}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/items/new");
            }}
            hitSlop={12}
          >
            <GlassSurface
              isInteractive
              style={{
                height: 44,
                width: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
              fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line/60 dark:border-line-dark/60"
            >
              <SymbolView name="plus" size={20} tintColor={fg} weight="semibold" />
            </GlassSurface>
          </Pressable>
        </View>
      </View>

      <View className="border-b border-line dark:border-line-dark">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 8 }}
        >
          <Pill label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              label={CATEGORY_LABELS[c]}
              selected={filter === c}
              onPress={() => setFilter(c)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            data={sorted}
            numColumns={2}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1, padding: 4 }}>
                <ItemCard item={item} onPress={() => router.push(`/items/${item.id}`)} />
              </View>
            )}
          />
        </View>
      )}
    </Screen>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-12">
      <Text variant="title" className="text-center mb-2">
        Your closet is empty
      </Text>
      <Text variant="caption" className="text-center mb-6">
        Add a few pieces and Closetly will pair them for you.
      </Text>
      <Pressable
        onPress={() => router.push("/items/new")}
        className="h-12 px-6 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
      >
        <Text className="text-canvas dark:text-canvas-dark font-medium">Add your first item</Text>
      </Pressable>
    </View>
  );
}
