import { ScrollView } from "react-native";
import { SymbolView } from "expo-symbols";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Text } from "~/components/ui/Text";
import { PressableScale } from "~/components/ui/PressableScale";
import type { ActiveTag } from "~/features/closet/filters";

const CHIP_ENTER = FadeIn.duration(180);
const CHIP_EXIT = FadeOut.duration(140);
const CHIP_LAYOUT = LinearTransition.duration(220);

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
        <Animated.View
          key={`${tag.group}:${tag.value}`}
          entering={CHIP_ENTER}
          exiting={CHIP_EXIT}
          layout={CHIP_LAYOUT}
        >
          <RemovableChip
            label={tag.value}
            onRemove={() => onRemove(tag)}
          />
        </Animated.View>
      ))}
      <Animated.View layout={CHIP_LAYOUT}>
        <PressableScale
          onPress={onClearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          hitSlop={12}
          className="px-3 py-1.5 rounded-full"
        >
          <Text variant="caption" className="underline">
            Clear all
          </Text>
        </PressableScale>
      </Animated.View>
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
    <PressableScale
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove filter ${label}`}
      hitSlop={10}
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink dark:bg-ink-dark"
    >
      <Text className="text-sm text-canvas dark:text-canvas-dark">{label}</Text>
      <SymbolView name="xmark" size={10} tintColor="#f5f3ef" weight="bold" />
    </PressableScale>
  );
}
