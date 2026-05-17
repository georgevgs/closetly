import { Pressable } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { GlassSurface } from "./GlassSurface";

const SIZE = 44;
const RADIUS = SIZE / 2;

type Props = {
  symbol: SymbolViewProps["name"];
  symbolSize?: number;
  foreground: string;
  accessibilityLabel: string;
  onPress: () => void;
};

export function CircularGlassButton({
  symbol,
  symbolSize = 18,
  foreground,
  accessibilityLabel,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassSurface
        isInteractive
        style={{
          height: SIZE,
          width: SIZE,
          borderRadius: RADIUS,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
        fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line/60 dark:border-line-dark/60"
      >
        <SymbolView
          name={symbol}
          size={symbolSize}
          tintColor={foreground}
          weight="semibold"
        />
      </GlassSurface>
    </Pressable>
  );
}
