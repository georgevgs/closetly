import { View, type ViewProps, Platform } from "react-native";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { cn } from "../../lib/utils";

type GlassStyle = "regular" | "clear";

type Props = ViewProps & {
  glassEffectStyle?: GlassStyle;
  isInteractive?: boolean;
  tintColor?: string;
  fallbackClassName?: string;
};

const liquidGlassAvailable =
  Platform.OS === "ios" && isGlassEffectAPIAvailable();

export function GlassSurface({
  glassEffectStyle = "regular",
  isInteractive,
  tintColor,
  fallbackClassName,
  className,
  style,
  children,
  ...rest
}: Props) {
  if (liquidGlassAvailable) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        tintColor={tintColor}
        style={style}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={style}
      className={cn(
        "bg-canvas/80 dark:bg-canvas-dark/80 border border-line/40 dark:border-line-dark/40",
        fallbackClassName,
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
