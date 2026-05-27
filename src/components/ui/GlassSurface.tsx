import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  View,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { cn } from "../../lib/utils";

type GlassStyle = "regular" | "clear";
type GlassVariant = "card" | "capsule" | "circle";

type Props = ViewProps & {
  glassEffectStyle?: GlassStyle;
  isInteractive?: boolean;
  tintColor?: string;
  fallbackClassName?: string;
  variant?: GlassVariant;
};

const liquidGlassAvailable = isGlassEffectAPIAvailable();

export function GlassSurface({
  glassEffectStyle = "regular",
  isInteractive,
  tintColor,
  fallbackClassName,
  variant,
  className,
  style,
  children,
  ...rest
}: Props) {
  const reduceTransparency = useReduceTransparency();
  const shapeStyle = shapeStyleFor(variant);
  const composedStyle = composeStyle(shapeStyle, style);

  if (liquidGlassAvailable && !reduceTransparency) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        tintColor={tintColor}
        style={composedStyle}
        {...rest}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={composedStyle}
      className={cn(
        "bg-canvas dark:bg-canvas-dark border border-line dark:border-line-dark",
        fallbackClassName,
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

const useReduceTransparency = (): boolean => {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (isMounted) setReduceTransparency(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      (value) => {
        if (isMounted) setReduceTransparency(value);
      },
    );
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceTransparency;
};

const shapeStyleFor = (variant: GlassVariant | undefined): ViewStyle | null => {
  if (variant === undefined) return null;
  if (variant === "circle") {
    return { borderRadius: 9999, overflow: "hidden" };
  }
  if (variant === "capsule") {
    return { borderRadius: 9999, overflow: "hidden" };
  }
  return { borderRadius: 20, overflow: "hidden" };
};

const composeStyle = (
  shapeStyle: ViewStyle | null,
  style: Props["style"],
): Props["style"] => {
  if (shapeStyle === null) return style;
  if (style === undefined) return shapeStyle;
  return [shapeStyle, style];
};
