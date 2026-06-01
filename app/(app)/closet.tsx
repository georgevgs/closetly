import { useCallback, useMemo, useRef, useState } from "react";
import { ActionSheetIOS, RefreshControl, View, ScrollView } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Screen } from "~/components/ui/Screen";
import { Pill } from "~/components/ui/Pill";
import { CircularGlassButton } from "~/components/ui/CircularGlassButton";
import { FloatingChromeGroup } from "~/components/ui/FloatingChromeGroup";
import { ChromePill } from "~/components/ui/ChromePill";
import { ScreenTitlePill } from "~/components/ui/ScreenTitlePill";
import { spacing, symbolStyles } from "~/lib/designTokens";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { ClosetFilterSheet } from "~/features/closet/components/ClosetFilterSheet";
import { ActiveFilterChips } from "~/features/closet/components/ActiveFilterChips";
import { SearchField } from "~/features/closet/components/SearchField";
import { ClosetEmptyState } from "~/features/closet/components/ClosetEmptyState";
import { ClosetGridSkeleton } from "~/features/closet/components/ClosetGridSkeleton";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useToggleInWash } from "~/features/closet/hooks/useToggleInWash";
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
  const toggleInWash = useToggleInWash();
  const { visible: visibleCategories } = useCategoryPrefs();
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [filters, setFilters] = useState<ClosetFilters>(emptyClosetFilters);
  const [chromeHeight, setChromeHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setIsRefreshing(false);
  };

  // If the user hides the currently-active category in their prefs, fall back
  // to "all" for the view without resetting the stored filter — re-enabling
  // the category later restores their selection.
  const effectiveFilter = effectiveCategoryFilter(filter, visibleCategories);
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
    const byCategory = filterByCategory(filtered, effectiveFilter);
    return sortItems(byCategory, sort);
  }, [items, filtersForApply, effectiveFilter, sort]);

  const totalCount = totalItemCount(items);
  const activeTags = listActiveTags(filters);
  const hasActiveFilters = isFiltering({
    activeTagCount: activeTags.length,
    searchText: filters.searchText,
    categoryFilter: effectiveFilter,
  });

  const openSortPicker = () => {
    const options = SORT_MODES.map((mode) => SORT_LABEL[mode]);
    const labels = [...options, "Cancel"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: labels,
        cancelButtonIndex: labels.length - 1,
        title: "Sort items",
      },
      (buttonIndex) => {
        if (buttonIndex >= SORT_MODES.length) return;
        setSort(SORT_MODES[buttonIndex]);
      },
    );
  };

  const updateSearchText = (next: string) => {
    setFilters((current) => ({ ...current, searchText: next }));
  };

  const openFilterSheet = () => {
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

  const handleLongPressItem = useCallback(
    (item: Item) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextInWash = !item.inWash;
      toggleInWash.mutate(
        { itemId: item.id, inWash: nextInWash },
        { onSuccess: () => toast.success(washToastFor(nextInWash)) },
      );
    },
    [toggleInWash],
  );

  return (
    <Screen>
      <ClosetBody
        isLoading={isLoading}
        items={visibleItems}
        hasAnyItems={totalCount > 0}
        hasActiveFilters={hasActiveFilters}
        chromeHeight={chromeHeight}
        bottomPadding={insets.bottom + 40}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        listHeader={
          <ListHeaderBlock
            activeTags={activeTags}
            onRemoveTag={removeTag}
            onClearTagFilters={clearTagFilters}
          />
        }
        onClearEverything={clearEverything}
        onLongPressItem={handleLongPressItem}
      />
      <View
        pointerEvents="box-none"
        onLayout={(event) => setChromeHeight(event.nativeEvent.layout.height)}
        style={{ position: "absolute", top: 0, left: 0, right: 0 }}
      >
        <ChromeOverlay
          sort={sort}
          onCycleSort={openSortPicker}
          foreground={foreground}
          searchText={filters.searchText}
          onChangeSearchText={updateSearchText}
          activeFilterCount={tagFilterCount(filters)}
          onOpenFilters={openFilterSheet}
          visibleCategories={visibleCategories}
          activeCategory={effectiveFilter}
          onSelectCategory={setFilter}
        />
      </View>
      <ClosetFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onChange={setFilters}
        onClear={clearTagFilters}
      />
    </Screen>
  );
}

function ChromeOverlay({
  sort,
  onCycleSort,
  foreground,
  searchText,
  onChangeSearchText,
  activeFilterCount,
  onOpenFilters,
  visibleCategories,
  activeCategory,
  onSelectCategory,
}: {
  sort: SortMode;
  onCycleSort: () => void;
  foreground: string;
  searchText: string;
  onChangeSearchText: (next: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
  visibleCategories: Category[];
  activeCategory: Category | "all";
  onSelectCategory: (next: Category | "all") => void;
}) {
  return (
    <View>
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingHorizontal: spacing.screenX,
          paddingTop: spacing.screenY,
          paddingBottom: spacing.innerGap,
          gap: spacing.groupGap,
        }}
      >
        <ScreenTitlePill label="Closet" />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.groupGap,
          }}
        >
          <ChromePill
            label={SORT_LABEL[sort]}
            symbol="arrow.up.arrow.down"
            foreground={foreground}
            onPress={onCycleSort}
            accessibilityLabel={`Sort: ${SORT_LABEL[sort]}`}
          />
          <FloatingChromeGroup spacing={6}>
            <CircularGlassButton
              symbol="square.grid.2x2"
              symbolSize={symbolStyles.chromePrimary.size}
              foreground={foreground}
              accessibilityLabel="Build outfit"
              onPress={openBuildOutfit}
            />
            <CircularGlassButton
              symbol="plus"
              symbolSize={symbolStyles.chromePrimary.size + 2}
              foreground={foreground}
              accessibilityLabel="Add item"
              onPress={openNewItem}
            />
          </FloatingChromeGroup>
        </View>
      </View>
      <SearchAndFilterBar
        searchText={searchText}
        onChangeSearchText={onChangeSearchText}
        activeFilterCount={activeFilterCount}
        onOpenFilters={onOpenFilters}
        foreground={foreground}
      />
      <CategoryRow
        visibleCategories={visibleCategories}
        active={activeCategory}
        onSelect={onSelectCategory}
      />
    </View>
  );
}

function ListHeaderBlock({
  activeTags,
  onRemoveTag,
  onClearTagFilters,
}: {
  activeTags: ActiveTag[];
  onRemoveTag: (tag: ActiveTag) => void;
  onClearTagFilters: () => void;
}) {
  return (
    <ActiveFilterChips
      tags={activeTags}
      onRemove={onRemoveTag}
      onClearAll={onClearTagFilters}
    />
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
  foreground,
}: {
  searchText: string;
  onChangeSearchText: (next: string) => void;
  activeFilterCount: number;
  onOpenFilters: () => void;
  foreground: string;
}) {
  return (
    <View
      className="flex-row items-center"
      style={{
        paddingHorizontal: spacing.screenX,
        paddingTop: spacing.innerGap,
        paddingBottom: spacing.innerGap,
        gap: spacing.groupGap,
      }}
    >
      <SearchField value={searchText} onChange={onChangeSearchText} />
      <ChromePill
        label="Filters"
        symbol="line.3.horizontal.decrease.circle"
        foreground={foreground}
        count={activeFilterCount}
        onPress={onOpenFilters}
        accessibilityLabel={filterButtonLabel(activeFilterCount)}
      />
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.screenX,
        paddingVertical: spacing.innerGap,
        gap: spacing.groupGap,
      }}
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
  );
}

function ClosetBody({
  isLoading,
  items,
  hasAnyItems,
  hasActiveFilters,
  chromeHeight,
  bottomPadding,
  isRefreshing,
  onRefresh,
  listHeader,
  onClearEverything,
  onLongPressItem,
}: {
  isLoading: boolean;
  items: Item[];
  hasAnyItems: boolean;
  hasActiveFilters: boolean;
  chromeHeight: number;
  bottomPadding: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  listHeader: React.ReactNode;
  onClearEverything: () => void;
  onLongPressItem: (item: Item) => void;
}) {
  if (isLoading) {
    return <ClosetGridSkeleton topPadding={chromeHeight + spacing.innerGap} />;
  }
  if (items.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        style={{ flex: 1, paddingTop: chromeHeight }}
      >
        <ClosetEmptyState
          hasAnyItems={hasAnyItems}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearEverything}
        />
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
      <ItemGrid
        items={items}
        chromeHeight={chromeHeight}
        bottomPadding={bottomPadding}
        listHeader={listHeader}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
        onLongPressItem={onLongPressItem}
      />
    </Animated.View>
  );
}

function ItemGrid({
  items,
  chromeHeight,
  bottomPadding,
  listHeader,
  isRefreshing,
  onRefresh,
  onLongPressItem,
}: {
  items: Item[];
  chromeHeight: number;
  bottomPadding: number;
  listHeader: React.ReactNode;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLongPressItem: (item: Item) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: spacing.screenX - 4,
          paddingTop: chromeHeight + spacing.innerGap,
          paddingBottom: bottomPadding,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            progressViewOffset={chromeHeight}
          />
        }
        ListHeaderComponent={<>{listHeader}</>}
        renderItem={({ item, index }) => (
          <View style={{ flex: 1, padding: 4 }}>
            <ItemCard
              item={item}
              priority={loadPriorityFor(index)}
              onPress={() => router.push(`/items/${item.id}`)}
              onLongPress={() => onLongPressItem(item)}
            />
          </View>
        )}
      />
    </View>
  );
}

const ABOVE_FOLD_CARD_COUNT = 6;

const loadPriorityFor = (index: number): "high" | "normal" => {
  if (index < ABOVE_FOLD_CARD_COUNT) return "high";
  return "normal";
};

const effectiveCategoryFilter = (
  filter: Category | "all",
  visibleCategories: readonly Category[],
): Category | "all" => {
  if (filter === "all") return "all";
  if (visibleCategories.includes(filter)) return filter;
  return "all";
};

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

const washToastFor = (inWash: boolean): string => {
  if (inWash) return "In the wash — hidden from suggestions";
  return "Back in rotation";
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
