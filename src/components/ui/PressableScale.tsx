import { useCallback } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

const PRESSED_SCALE = 0.96;
const PRESS_IN_DURATION_MS = 90;
const RELEASE_SPRING = { damping: 14, stiffness: 220, mass: 0.6 };

type Props = Omit<PressableProps, "style" | "children"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  pressedScale?: number;
};

export function PressableScale({
  children,
  style,
  className,
  pressedScale = PRESSED_SCALE,
  onPressIn,
  onPressOut,
  disabled,
  ...pressableProps
}: Props) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled) return;
      scaleValue.value = withTiming(pressedScale, {
        duration: PRESS_IN_DURATION_MS,
        easing: Easing.out(Easing.quad),
      });
      onPressIn?.(event);
    },
    [scaleValue, pressedScale, disabled, onPressIn],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scaleValue.value = withSpring(1, RELEASE_SPRING);
      onPressOut?.(event);
    },
    [scaleValue, onPressOut],
  );

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[style, animatedStyle]} className={className}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
