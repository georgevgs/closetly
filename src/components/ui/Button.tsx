import { Pressable, type PressableProps, View, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base =
  "items-center justify-center flex-row rounded-lg active:opacity-80";
const variants: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-ink dark:bg-ink-dark", text: "text-canvas dark:text-canvas-dark" },
  secondary: {
    container: "bg-line dark:bg-line-dark",
    text: "text-ink dark:text-ink-dark",
  },
  ghost: { container: "bg-transparent", text: "text-ink dark:text-ink-dark" },
  destructive: { container: "bg-red-600", text: "text-white" },
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

type Props = Omit<PressableProps, "children"> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  haptic?: boolean;
  className?: string;
  leading?: React.ReactNode;
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  haptic = true,
  className,
  leading,
  onPress,
  disabled,
  ...rest
}: Props) {
  const v = variants[variant];
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync();
        onPress?.(e);
      }}
      className={cn(
        base,
        sizes[size],
        v.container,
        (disabled || loading) && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <View className="flex-row items-center gap-2">
          {leading}
          <Text className={cn("font-medium", v.text)}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
