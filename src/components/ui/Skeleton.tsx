import { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { cn } from "../../lib/utils";
import { radii } from "../../lib/designTokens";

type Props = {
  height: number;
  width?: number | string;
  borderRadius?: number;
  className?: string;
  style?: ViewStyle;
};

export function Skeleton({
  height,
  width = "100%",
  borderRadius = radii.row,
  className,
  style,
}: Props) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ height, width, borderRadius } as ViewStyle, animatedStyle, style]}
      className={cn("bg-line dark:bg-line-dark", className)}
    />
  );
}
