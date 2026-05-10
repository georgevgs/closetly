import { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { useColorScheme } from "nativewind";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { GlassSurface } from "~/components/ui/GlassSurface";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { ClosetFilterSheet } from "~/features/closet/components/ClosetFilterSheet";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useAuth } from "~/features/auth/context";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import {
  applyClosetFilters,
  emptyClosetFilters,
  tagFilterCount,
  type ClosetFilters,
} from "~/features/closet/filters";
import { CATEGORIES, type Category, type Item } from "~/types/items";

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
  const { visible: visibleCategories } = useCategoryPrefs();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [filters, setFilters] = useState<ClosetFilters>(emptyClosetFilters);
  const filterSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (filter !== "all" && !visibleCategories.includes(filter)) setFilter("all");
  }, [filter, visibleCategories]);
  const { colorScheme } = useColorScheme();
  const fg = colorScheme === "dark" ? "#f5f3ef" : "#1a1a1a";

  const visibleItems = useMemo(() => {
    if (!items) return [];
    const filtered = applyClosetFilters(items, filters);
    const byCategory = filterByCategory(filtered, filter);
    return sortItems(byCategory, sort);
  }, [items, filters, filter, sort]);

  const cycleSort = () => {
    Haptics.selectionAsync();
    const index = SORT_MODES.indexOf(sort);
    setSort(SORT_MODES[(index + 1) % SORT_MODES.length]);
  };

  const updateSearchText = (next: string) => {
    setFilters((current) => ({ ...current, searchText: next }));
  };

  const openFilterSheet = () => {
    Haptics.selectionAsync();
    filterSheetRef.current?.present();
  };

  const clearTagFilters = () => {
    setFilters((current) => ({
      ...current,
      styles: new Set(),
      seasons: new Set(),
      patterns: new Set(),
      occasions: new Set(),
    }));
  };

  return (
    <Screen>
      <ClosetHeader sort={sort} onCycleSort={cycleSort} fg={fg} />
      <SearchAndFilterBar
        searchText={filters.searchText}
        onChangeSearchText={updateSearchText}
        activeFilterCount={tagFilterCount(filters)}
        onOpenFilters={openFilterSheet}
      />
      <CategoryRow
        visibleCategories={visibleCategories}
        active={filter}
        onSelect={setFilter}
      />
      <ClosetBody isLoading={isLoading} items={visibleItems} />
      <ClosetFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onChange={setFilters}
        onClear={clearTagFilters}
      />
    </Screen>
  );
}

function ClosetHeader({
  sort,
  onCycleSort,
  fg,
}: {
  sort: SortMode;
  onCycleSort: () => void;
  fg: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
      <Text variant="display">Closet</Text>
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onCycleSort}
          hitSlop={8}
          className="flex-row items-center gap-1.5 h-9 px-3 rounded-full border border-line dark:border-line-dark"
        >
          <SymbolView name="arrow.up.arrow.down" size={11} tintColor={fg} />
          <Text variant="caption" className="text-ink dark:text-ink-dark">
            {SORT_LABEL[sort]}
          </Text>
        </Pressable>
        <BuildOutfitButton fg={fg} />
        <AddItemButton fg={fg} />
      </View>
    </View>
  );
}

function BuildOutfitButton({ fg }: { fg: string }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/outfits/build");
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Build outfit"
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
        <SymbolView name="square.grid.2x2" size={18} tintColor={fg} weight="semibold" />
      </GlassSurface>
    </Pressable>
  );
}

function AddItemButton({ fg }: { fg: string }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/items/new");
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Add item"
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
  );
}

function SearchAndFilterBar({
  searchText,
  onChangeSearchText,
  activeFilterCount,
  onOpenFilters,
}: {
  searchText: string;
  onChangeSearchText: (next: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
}) {
  return (
    <View className="flex-row items-center gap-2 px-6 pb-2">
      <TextInput
        value={searchText}
        onChangeText={onChangeSearchText}
        placeholder="Search by name or brand"
        placeholderTextColor="#a8a29e"
        className="flex-1 h-10 px-4 rounded-full border border-line dark:border-line-dark text-ink dark:text-ink-dark"
        returnKeyType="search"
      />
      <Pressable
        onPress={onOpenFilters}
        hitSlop={8}
        className="h-10 px-4 rounded-full border border-line dark:border-line-dark items-center justify-center"
      >
        <Text variant="caption">{filterButtonLabel(activeFilterCount)}</Text>
      </Pressable>
    </View>
  );
}

function CategoryRow({
  visibleCategories,
  active,
  onSelect,
}: {
  visibleCategories: Category[];
  active: Category | "all";
  onSelect: (next: Category | "all") => void;
}) {
  return (
    <View className="border-b border-line dark:border-line-dark">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 8, gap: 8 }}
      >
        <Pill label="All" selected={active === "all"} onPress={() => onSelect("all")} />
        {visibleCategories.map((category) => (
          <Pill
            key={category}
            label={CATEGORY_LABELS[category]}
            selected={active === category}
            onPress={() => onSelect(category)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function ClosetBody({
  isLoading,
  items,
}: {
  isLoading: boolean;
  items: Item[];
}) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  if (items.length === 0) return <EmptyState />;
  return <ItemGrid items={items} />;
}

function ItemGrid({ items }: { items: Item[] }) {
  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 4 }}>
            <ItemCard item={item} onPress={() => router.push(`/items/${item.id}`)} />
          </View>
        )}
      />
    </View>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-12">
      <Text variant="title" className="text-center mb-2">
        Nothing matches
      </Text>
      <Text variant="caption" className="text-center mb-6">
        Try clearing the search or filters, or add a new piece.
      </Text>
      <Pressable
        onPress={() => router.push("/items/new")}
        className="h-12 px-6 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
      >
        <Text className="text-canvas dark:text-canvas-dark font-medium">Add an item</Text>
      </Pressable>
    </View>
  );
}

const filterByCategory = (items: Item[], filter: Category | "all"): Item[] => {
  if (filter === "all") return items;
  return items.filter((item) => item.category === filter);
};

const sortItems = (items: Item[], sort: SortMode): Item[] => {
  const arr = [...items];
  if (sort === "newest") {
    arr.sort((first, second) => second.created_at.localeCompare(first.created_at));
    return arr;
  }
  if (sort === "oldest") {
    arr.sort((first, second) => first.created_at.localeCompare(second.created_at));
    return arr;
  }
  arr.sort((first, second) => {
    const categoryDiff =
      CATEGORIES.indexOf(first.category) - CATEGORIES.indexOf(second.category);
    if (categoryDiff !== 0) return categoryDiff;
    return second.created_at.localeCompare(first.created_at);
  });
  return arr;
};

const filterButtonLabel = (activeCount: number): string => {
  if (activeCount === 0) return "Filters";
  return `Filters · ${activeCount}`;
};
