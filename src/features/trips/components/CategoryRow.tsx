import { ScrollView, View } from "react-native";
import { Text } from "~/components/ui/Text";
import { ItemCard } from "~/features/closet/components/ItemCard";
import type { Item } from "~/types/items";

export function CategoryRow({
  category,
  items,
}: {
  category: string;
  items: Item[];
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        {category} ({items.length})
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {items.map((item) => (
          <View key={item.id} style={{ width: 110 }}>
            <ItemCard item={item} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
