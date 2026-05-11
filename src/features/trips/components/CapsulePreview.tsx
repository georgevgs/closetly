import { View } from "react-native";
import { Text } from "~/components/ui/Text";
import { CategoryRow } from "./CategoryRow";
import type { Capsule } from "~/features/trips/capsule";

export function CapsulePreview({ capsule }: { capsule: Capsule }) {
  if (capsule.itemCount === 0) {
    return <CapsuleEmptyState />;
  }

  return (
    <View className="mt-8 gap-4">
      <View className="rounded-xl border border-line dark:border-line-dark p-4">
        <Text variant="caption" className="uppercase tracking-widest">
          Capsule
        </Text>
        <Text variant="title">{capsule.itemCount} pieces</Text>
        <Text variant="caption" className="mt-1">
          Updates as you tweak the filters above.
        </Text>
      </View>

      {Object.entries(capsule.byCategory).map(([category, list]) => {
        if (list.length === 0) return null;
        return <CategoryRow key={category} category={category} items={list} />;
      })}
    </View>
  );
}

function CapsuleEmptyState() {
  return (
    <View className="mt-8 rounded-xl border border-dashed border-line dark:border-line-dark p-6">
      <Text variant="title">Nothing matches yet</Text>
      <Text variant="caption" className="mt-1">
        Try widening the temperature range or adding more seasons.
      </Text>
    </View>
  );
}
