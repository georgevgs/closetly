import { View } from "react-native";
import { Text } from "~/components/ui/Text";
import { Card } from "~/components/ui/Card";
import { CategoryRow } from "./CategoryRow";
import type { Capsule } from "~/features/trips/capsule";

export function CapsulePreview({ capsule }: { capsule: Capsule }) {
  if (capsule.itemCount === 0) {
    return <CapsuleEmptyState />;
  }

  return (
    <View className="mt-8 gap-4">
      <Card padding="md">
        <Text variant="caption" className="uppercase tracking-widest">
          Capsule
        </Text>
        <Text variant="title">{capsule.itemCount} pieces</Text>
        <Text variant="caption" className="mt-1">
          Updates as you tweak the filters above.
        </Text>
      </Card>

      {Object.entries(capsule.byCategory).map(([category, list]) => {
        if (list.length === 0) return null;
        return <CategoryRow key={category} category={category} items={list} />;
      })}
    </View>
  );
}

function CapsuleEmptyState() {
  return (
    <View className="mt-8">
      <Card padding="lg" className="border-dashed">
        <Text variant="title">Nothing matches yet</Text>
        <Text variant="caption" className="mt-1">
          Try widening the temperature range or adding more seasons.
        </Text>
      </Card>
    </View>
  );
}
