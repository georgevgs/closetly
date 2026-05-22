import { Pressable } from "react-native";

import { Text } from "~/components/ui/Text";
import { warmthLabel } from "~/lib/seasons";
import type { Warmth } from "~/types/items";

export function WarmthDefaultsButton({
  warmth,
  onApply,
}: {
  warmth: Warmth;
  onApply: () => void;
}) {
  return (
    <Pressable onPress={onApply} hitSlop={8} className="mt-2 self-start">
      <Text variant="caption" className="underline">
        Use warmth defaults ({warmthLabel(warmth)})
      </Text>
    </Pressable>
  );
}
