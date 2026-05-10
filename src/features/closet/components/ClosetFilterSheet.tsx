import { forwardRef, useCallback } from "react";
import { Pressable, ScrollView, View } from "react-native";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { STYLES, SEASONS, PATTERNS, OCCASIONS } from "~/types/items";
import { type ClosetFilters, tagFilterCount } from "~/features/closet/filters";

export type ClosetFilterSheetProps = {
  filters: ClosetFilters;
  onChange: (next: ClosetFilters) => void;
  onClear: () => void;
};

export const ClosetFilterSheet = forwardRef<
  BottomSheetModal,
  ClosetFilterSheetProps
>(function ClosetFilterSheet({ filters, onChange, onClear }, ref) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <SheetHeader
          activeCount={tagFilterCount(filters)}
          onClear={onClear}
        />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}>
          <FilterGroup
            title="Style"
            options={STYLES}
            selected={filters.styles}
            onToggle={(value) =>
              onChange({ ...filters, styles: toggleSetValue(filters.styles, value) })
            }
          />
          <FilterGroup
            title="Season"
            options={SEASONS}
            selected={filters.seasons}
            onToggle={(value) =>
              onChange({ ...filters, seasons: toggleSetValue(filters.seasons, value) })
            }
          />
          <FilterGroup
            title="Pattern"
            options={PATTERNS}
            selected={filters.patterns}
            onToggle={(value) =>
              onChange({ ...filters, patterns: toggleSetValue(filters.patterns, value) })
            }
          />
          <FilterGroup
            title="Occasion"
            options={OCCASIONS}
            selected={filters.occasions}
            onToggle={(value) =>
              onChange({ ...filters, occasions: toggleSetValue(filters.occasions, value) })
            }
          />
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const SNAP_POINTS = ["75%"];

function SheetHeader({
  activeCount,
  onClear,
}: {
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-line dark:border-line-dark">
      <Text variant="title">Filters</Text>
      <Pressable onPress={onClear} hitSlop={8}>
        <Text variant="caption" className="underline">
          {clearLabel(activeCount)}
        </Text>
      </Pressable>
    </View>
  );
}

function FilterGroup<Tag extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly Tag[];
  selected: Set<Tag>;
  onToggle: (value: Tag) => void;
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Pill
            key={option}
            label={option}
            selected={selected.has(option)}
            onPress={() => onToggle(option)}
          />
        ))}
      </View>
    </View>
  );
}

const toggleSetValue = <Tag,>(set: Set<Tag>, value: Tag): Set<Tag> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const clearLabel = (activeCount: number): string => {
  if (activeCount === 0) return "Clear";
  return `Clear (${activeCount})`;
};
