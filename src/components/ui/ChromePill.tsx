import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { GlassSurface } from "./GlassSurface";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { spacing, symbolStyles } from "../../lib/designTokens";

type Props = {
  label: string;
  onPress: () => void;
  symbol?: SymbolViewProps["name"];
  foreground: string;
  count?: number | null;
  active?: boolean;
  accessibilityLabel?: string;
};

export function ChromePill({
  label,
  onPress,
  symbol,
  foreground,
  count,
  active,
  accessibilityLabel,
}: Props) {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };
  return (
    <PressableScale
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={pillAccessibilityLabel(accessibilityLabel, label)}
    >
      <GlassSurface
        isInteractive
        variant="capsule"
        tintColor={tintFor(active)}
        style={{
          height: spacing.touchTarget,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
        fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line dark:border-line-dark"
      >
        {symbol !== undefined && (
          <SymbolView
            name={symbol}
            size={symbolStyles.chromePrimary.size}
            tintColor={foreground}
            weight={symbolStyles.chromePrimary.weight}
          />
        )}
        <Text variant="caption" className="text-ink dark:text-ink-dark">
          {label}
        </Text>
        {hasCount(count) && <CountBadge count={count} foreground={foreground} />}
      </GlassSurface>
    </PressableScale>
  );
}

const pillAccessibilityLabel = (
  accessibilityLabel: string | undefined,
  label: string,
): string => {
  if (accessibilityLabel !== undefined) return accessibilityLabel;
  return label;
};

function CountBadge({ count, foreground }: { count: number; foreground: string }) {
  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        paddingHorizontal: 5,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: foreground,
      }}
    >
      <Text variant="badge">{count}</Text>
    </View>
  );
}

const tintFor = (active: boolean | undefined): string | undefined => {
  if (active) return "rgba(168, 90, 59, 0.18)";
  return undefined;
};

const hasCount = (count: number | null | undefined): count is number => {
  if (count === null) return false;
  if (count === undefined) return false;
  if (count === 0) return false;
  return true;
};
