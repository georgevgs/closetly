import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { GlassSurface } from "./GlassSurface";
import { PressableScale } from "./PressableScale";
import { cn } from "../../lib/utils";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Pill({ label, selected, onPress, className }: Props) {
  if (selected) {
    return (
      <PillTouchWrap onPress={onPress} accessibilityLabel={label}>
        <View
          className={cn(
            "px-3 py-1.5 rounded-full bg-ink dark:bg-ink-dark border border-ink dark:border-ink-dark",
            className,
          )}
        >
          <Text className="text-sm text-canvas dark:text-canvas-dark">
            {label}
          </Text>
        </View>
      </PillTouchWrap>
    );
  }
  return (
    <PillTouchWrap onPress={onPress} accessibilityLabel={label}>
      <GlassSurface
        variant="capsule"
        isInteractive={onPress !== undefined}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
        fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line dark:border-line-dark"
      >
        <Text className={cn("text-sm text-ink dark:text-ink-dark", className)}>
          {label}
        </Text>
      </GlassSurface>
    </PillTouchWrap>
  );
}

function PillTouchWrap({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: (() => void) | undefined;
  accessibilityLabel?: string;
  children: React.ReactNode;
}) {
  if (onPress === undefined) {
    return <>{children}</>;
  }
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };
  return (
    <PressableScale
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </PressableScale>
  );
}
