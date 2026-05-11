import { View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../../lib/utils";

type Props = ViewProps & {
  className?: string;
  children: React.ReactNode;
};

export function BottomBar({ className, children, ...rest }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      {...rest}
      className={cn(
        "border-t border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark px-6 pt-3",
        className,
      )}
      style={[{ paddingBottom: insets.bottom + 12 }, rest.style]}
    >
      {children}
    </View>
  );
}
