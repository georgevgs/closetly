import { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useColorScheme } from "nativewind";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { CircularGlassButton } from "~/components/ui/CircularGlassButton";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { ClosetFilterSheet } from "~/features/closet/components/ClosetFilterSheet";
import { ActiveFilterChips } from "~/features/closet/components/ActiveFilterChips";
import { SearchField } from "~/features/closet/components/SearchField";
import { ClosetEmptyState } from "~/features/closet/components/ClosetEmptyState";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useAuth } from "~/features/auth/context";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import { useDebouncedValue } from "~/hooks/useDebouncedValue";
import {
  applyClosetFilters,
  emptyClosetFilters,
  listActiveTags,
  removeActiveTag,
  tagFilterCount,
  type ActiveTag,
  type ClosetFilters,
} from "~/features/closet/filters";
import { foregroundFor } from "~/lib/utils";
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

const SEARCH_DEBOUNCE_MS = 150;

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
  const foreground = foregroundFor(colorScheme);

  const debouncedSearchText = useDebouncedValue(filters.searchText, SEARCH_DEBOUNCE_MS);
  const filtersForApply = useMemo(
    () => ({ ...filters, searchText: debouncedSearchText }),
    [filters, debouncedSearchText],
  );

  const visibleItems = useMemo(() => {
    if (!items) return [];
    const filtered = applyClosetFilters(items, filtersForApply);
    const byCategory = filterByCategory(filtered, filter);
    return sortItems(byCategory, sort);
  }, [items, filtersForApply, filter, sort]);

  const totalCount = totalItemCount(items);
  const visibleCount = visibleItems.length;
  const activeTags = listActiveTags(filters);
  const hasActiveFilters = isFiltering({
    activeTagCount: activeTags.length,
    searchText: filters.searchText,
    categoryFilter: filter,
  });

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

  const removeTag = (tag: ActiveTag) => {
    setFilters((current) => removeActiveTag(current, tag));
  };

  const clearEverything = () => {
    setFilters(emptyClosetFilters());
    setFilter("all");
  };

  return (
    <Screen>
      <ClosetHeader sort={sort} onCycleSort={cycleSort} foreground={foreground} />
      <SearchAndFilterBar
        searchText={filters.searchText}
        onChangeSearchText={updateSearchText}
        activeFilterCount={tagFilterCount(filters)}
        onOpenFilters={openFilterSheet}
      />
      <ActiveFilterChips
        tags={activeTags}
        onRemove={removeTag}
        onClearAll={clearTagFilters}
      />
      <CategoryRow
        visibleCategories={visibleCategories}
        active={filter}
        onSelect={setFilter}
      />
      <CountBadge
        visibleCount={visibleCount}
        totalCount={totalCount}
        isLoading={isLoading}
      />
      <ClosetBody
        isLoading={isLoading}
        items={visibleItems}
        hasAnyItems={totalCount > 0}
        hasActiveFilters={hasActiveFilters}
        onClearEverything={clearEverything}
      />
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
  foreground,
}: {
  sort: SortMode;
  onCycleSort: () => void;
  foreground: string;
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
          <SymbolView name="arrow.up.arrow.down" size={11} tintColor={foreground} />
          <Text variant="caption" className="text-ink dark:text-ink-dark">
            {SORT_LABEL[sort]}
          </Text>
        </Pressable>
        <CircularGlassButton
          symbol="square.grid.2x2"
          symbolSize={18}
          foreground={foreground}
          accessibilityLabel="Build outfit"
          onPress={openBuildOutfit}
        />
        <CircularGlassButton
          symbol="plus"
          symbolSize={20}
          foreground={foreground}
          accessibilityLabel="Add item"
          onPress={openNewItem}
        />
      </View>
    </View>
  );
}

const openBuildOutfit = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push("/outfits/build");
};

const openNewItem = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push("/items/new");
};

const totalItemCount = (items: Item[] | undefined): number => {
  if (!items) return 0;
  return items.length;
};

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
      <SearchField value={searchText} onChange={onChangeSearchText} />
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

function CountBadge({
  visibleCount,
  totalCount,
  isLoading,
}: {
  visibleCount: number;
  totalCount: number;
  isLoading: boolean;
}) {
  if (isLoading) return null;
  if (totalCount === 0) return null;
  return (
    <View className="px-6 pt-2 pb-1">
      <Text variant="caption">{countLabel(visibleCount, totalCount)}</Text>
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
  hasAnyItems,
  hasActiveFilters,
  onClearEverything,
}: {
  isLoading: boolean;
  items: Item[];
  hasAnyItems: boolean;
  hasActiveFilters: boolean;
  onClearEverything: () => void;
}) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  if (items.length === 0) {
    return (
      <ClosetEmptyState
        hasAnyItems={hasAnyItems}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearEverything}
      />
    );
  }
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

const filterByCategory = (items: Item[], filter: Category | "all"): Item[] => {
  if (filter === "all") return items;
  return items.filter((item) => item.category === filter);
};

const sortItems = (items: Item[], sort: SortMode): Item[] => {
  const sorted = [...items];
  if (sort === "newest") {
    sorted.sort((first, second) => second.created_at.localeCompare(first.created_at));
    return sorted;
  }
  if (sort === "oldest") {
    sorted.sort((first, second) => first.created_at.localeCompare(second.created_at));
    return sorted;
  }
  sorted.sort((first, second) => {
    const categoryDiff =
      CATEGORIES.indexOf(first.category) - CATEGORIES.indexOf(second.category);
    if (categoryDiff !== 0) return categoryDiff;
    return second.created_at.localeCompare(first.created_at);
  });
  return sorted;
};

const filterButtonLabel = (activeCount: number): string => {
  if (activeCount === 0) return "Filters";
  return `Filters · ${activeCount}`;
};

const countLabel = (visibleCount: number, totalCount: number): string => {
  if (visibleCount === totalCount) {
    if (totalCount === 1) return "1 piece";
    return `${totalCount} pieces`;
  }
  return `${visibleCount} of ${totalCount} pieces`;
};

const isFiltering = ({
  activeTagCount,
  searchText,
  categoryFilter,
}: {
  activeTagCount: number;
  searchText: string;
  categoryFilter: Category | "all";
}): boolean => {
  if (activeTagCount > 0) return true;
  if (searchText.trim().length > 0) return true;
  if (categoryFilter !== "all") return true;
  return false;
};
