import { View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "../../lib/utils";

export function Screen({
  className,
  children,
  edges = ["top", "left", "right"],
  ...props
}: ViewProps & { edges?: ("top" | "bottom" | "left" | "right")[] }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark" edges={edges}>
      <View className={cn("flex-1", className)} {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}
