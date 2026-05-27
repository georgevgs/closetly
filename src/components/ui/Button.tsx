import { type PressableProps, View, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Text } from "./Text";
import { PressableScale } from "./PressableScale";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base = "items-center justify-center flex-row rounded-lg";
const variants: Record<Variant, { container: string; text: string }> = {
  primary: { container: "bg-ink dark:bg-ink-dark", text: "text-canvas dark:text-canvas-dark" },
  secondary: {
    container: "bg-line dark:bg-line-dark",
    text: "text-ink dark:text-ink-dark",
  },
  ghost: { container: "bg-transparent", text: "text-ink dark:text-ink-dark" },
  destructive: { container: "bg-destructive dark:bg-destructive-dark", text: "text-canvas dark:text-canvas-dark" },
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-12 px-5",
  lg: "h-14 px-6",
};

type Props = Omit<PressableProps, "children" | "style"> & {
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
  const styles = variants[variant];
  const isDisabled = isButtonDisabled(disabled, loading);
  return (
    <PressableScale
      {...rest}
      disabled={isDisabled}
      onPress={(event) => {
        if (haptic) Haptics.selectionAsync();
        onPress?.(event);
      }}
      className={cn(
        base,
        sizes[size],
        styles.container,
        isDisabled && "opacity-50",
        className,
      )}
    >
      <ButtonBody loading={loading} leading={leading} label={label} textClass={styles.text} />
    </PressableScale>
  );
}

function ButtonBody({
  loading,
  leading,
  label,
  textClass,
}: {
  loading?: boolean;
  leading?: React.ReactNode;
  label: string;
  textClass: string;
}) {
  if (loading) return <ActivityIndicator color="white" />;
  return (
    <View className="flex-row items-center gap-2">
      {leading}
      <Text className={cn("font-medium", textClass)}>{label}</Text>
    </View>
  );
}

const isButtonDisabled = (
  disabled: boolean | null | undefined,
  loading: boolean | undefined,
): boolean => {
  if (disabled === true) return true;
  if (loading === true) return true;
  return false;
};
