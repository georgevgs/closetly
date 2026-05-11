import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Text } from "~/components/ui/Text";

type Props = {
  hasAnyItems: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

export function ClosetEmptyState({
  hasAnyItems,
  hasActiveFilters,
  onClearFilters,
}: Props) {
  if (hasAnyItems && hasActiveFilters) {
    return <FilteredEmpty onClearFilters={onClearFilters} />;
  }
  return <UnpopulatedEmpty />;
}

function FilteredEmpty({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-12">
      <Text variant="title" className="text-center mb-2">
        Nothing matches
      </Text>
      <Text variant="caption" className="text-center mb-6">
        Try clearing the search or filters to widen the results.
      </Text>
      <Pressable
        onPress={onClearFilters}
        className="h-12 px-6 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
      >
        <Text className="text-canvas dark:text-canvas-dark font-medium">
          Clear filters
        </Text>
      </Pressable>
    </View>
  );
}

function UnpopulatedEmpty() {
  return (
    <View className="flex-1 items-center justify-center px-12">
      <Text variant="title" className="text-center mb-2">
        Your closet is empty
      </Text>
      <Text variant="caption" className="text-center mb-6">
        Add a piece to start building outfits and trip capsules.
      </Text>
      <Pressable
        onPress={() => router.push("/items/new")}
        className="h-12 px-6 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center"
      >
        <Text className="text-canvas dark:text-canvas-dark font-medium">
          Add an item
        </Text>
      </Pressable>
    </View>
  );
}
