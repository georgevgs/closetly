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
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      className={cn(
        "px-3 py-1.5 rounded-full border",
        selected
          ? "bg-ink dark:bg-ink-dark border-ink dark:border-ink-dark"
          : "bg-transparent border-line dark:border-line-dark",
        className
      )}
    >
      <Text
        className={cn(
          "text-sm",
          selected ? "text-canvas dark:text-canvas-dark" : "text-ink dark:text-ink-dark"
        )}
      >
        {label}
      </Text>
    </Wrap>
  );
}
