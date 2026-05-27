import { View } from "react-native";
import { Text } from "./Text";
import { cn } from "../../lib/utils";

type Props = {
  label: string;
  className?: string;
};

export function Tag({ label, className }: Props) {
  return (
    <View
      className={cn(
        "px-2.5 py-1 rounded-full border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark",
        className,
      )}
    >
      <Text variant="caption" className="text-ink dark:text-ink-dark">
        {label}
      </Text>
    </View>
  );
}
