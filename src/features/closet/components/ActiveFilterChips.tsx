import { Pressable, ScrollView } from "react-native";
import { SymbolView } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import type { ActiveTag } from "~/features/closet/filters";

type Props = {
  tags: ActiveTag[];
  onRemove: (tag: ActiveTag) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({ tags, onRemove, onClearAll }: Props) {
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8, gap: 6 }}
    >
      {tags.map((tag) => (
        <RemovableChip
          key={`${tag.group}:${tag.value}`}
          label={tag.value}
          onRemove={() => onRemove(tag)}
        />
      ))}
      <Pressable
        onPress={onClearAll}
        accessibilityRole="button"
        accessibilityLabel="Clear all filters"
        hitSlop={6}
        className="px-3 py-1.5 rounded-full"
      >
        <Text variant="caption" className="underline">
          Clear all
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function RemovableChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      hitSlop={4}
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink dark:bg-ink-dark"
    >
      <Text className="text-sm text-canvas dark:text-canvas-dark">{label}</Text>
      <SymbolView name="xmark" size={10} tintColor="#f5f3ef" weight="bold" />
    </Pressable>
  );
}
