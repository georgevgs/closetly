import { View } from "react-native";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Text } from "~/components/ui/Text";
import { ItemCard } from "~/features/closet/components/ItemCard";
import { cn } from "~/lib/utils";
import type { Item } from "~/types/items";

type Props = {
  item: Item;
  selected: boolean;
  unworn: boolean;
  onToggle: (item: Item) => void;
};

export function SwapItemTile({ item, selected, unworn, onToggle }: Props) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onToggle(item);
  };
  return (
    <View className={cn(tileOpacityClass(selected))}>
      <ItemCard item={item} selected={selected} size="sm" onPress={handlePress} />
      <View pointerEvents="none" className="absolute top-2 right-2">
        <SelectionMark selected={selected} />
      </View>
      {unworn && <UnwornBadge />}
    </View>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <View className="w-6 h-6 rounded-full bg-ink dark:bg-ink-dark items-center justify-center">
        <SymbolView name="checkmark" size={12} weight="bold" tintColor="#f5f3ef" />
      </View>
    );
  }
  return (
    <View className="w-6 h-6 rounded-full border-2 border-canvas dark:border-canvas-dark bg-canvas/40 dark:bg-canvas-dark/40" />
  );
}

function UnwornBadge() {
  return (
    <View
      pointerEvents="none"
      className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-canvas/90 dark:bg-canvas-dark/90 border border-line dark:border-line-dark"
    >
      <Text variant="caption" className="text-xs">
        Unworn
      </Text>
    </View>
  );
}

const tileOpacityClass = (selected: boolean): string => {
  if (selected) return "";
  return "opacity-60";
};
