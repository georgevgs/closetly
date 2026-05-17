import { Pressable, View } from "react-native";
import { Text } from "./Text";
import { cn } from "../../lib/utils";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Pill({ label, selected, onPress, className }: Props) {
  const containerClass = cn(
    "px-3 py-1.5 rounded-full border",
    containerSelectionClass(selected),
    className,
  );
  const labelClass = cn("text-sm", labelSelectionClass(selected));

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={containerClass}>
        <Text className={labelClass}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View className={containerClass}>
      <Text className={labelClass}>{label}</Text>
    </View>
  );
}

const containerSelectionClass = (selected: boolean | undefined): string => {
  if (selected) return "bg-ink dark:bg-ink-dark border-ink dark:border-ink-dark";
  return "bg-transparent border-line dark:border-line-dark";
};

const labelSelectionClass = (selected: boolean | undefined): string => {
  if (selected) return "text-canvas dark:text-canvas-dark";
  return "text-ink dark:text-ink-dark";
};
