import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassSurface } from "./GlassSurface";
import { cn } from "../../lib/utils";

type Props = ViewProps & {
  className?: string;
  children: React.ReactNode;
};

const HORIZONTAL_INSET = 12;
const BAR_HORIZONTAL_PADDING = 16;
const BAR_VERTICAL_PADDING = 12;

export function BottomBar({ className, style, children, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + 8;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: HORIZONTAL_INSET,
        right: HORIZONTAL_INSET,
        bottom: bottomOffset,
      }}
    >
      <GlassSurface
        variant="card"
        isInteractive
        style={[
          {
            paddingHorizontal: BAR_HORIZONTAL_PADDING,
            paddingVertical: BAR_VERTICAL_PADDING,
            borderRadius: 28,
          },
          style,
        ]}
        fallbackClassName="bg-canvas/90 dark:bg-canvas-dark/90 border border-line/50 dark:border-line-dark/50"
        className={cn(className)}
        {...rest}
      >
        {children}
      </GlassSurface>
    </View>
  );
}

export const BOTTOM_BAR_ESTIMATED_HEIGHT = 88;

export const useBottomBarSpacing = (): number => {
  const insets = useSafeAreaInsets();
  return BOTTOM_BAR_ESTIMATED_HEIGHT + insets.bottom + 8;
};
