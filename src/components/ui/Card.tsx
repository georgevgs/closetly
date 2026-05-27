import { View, type ViewProps, type ViewStyle } from "react-native";
import { cn } from "../../lib/utils";
import { radii } from "../../lib/designTokens";

type CardPadding = "none" | "sm" | "md" | "lg";

type Props = ViewProps & {
  padding?: CardPadding;
  selected?: boolean;
  destructive?: boolean;
};

export function Card({
  padding = "md",
  selected,
  destructive,
  className,
  style,
  children,
  ...rest
}: Props) {
  const paddingClass = paddingClassFor(padding);
  const borderClass = borderClassFor({ selected, destructive });
  return (
    <View
      style={composeStyle(style)}
      className={cn(
        "bg-canvas dark:bg-canvas-dark border",
        paddingClass,
        borderClass,
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}

const composeStyle = (style: Props["style"]): Props["style"] => {
  const base: ViewStyle = { borderRadius: radii.card };
  if (style === undefined) return base;
  return [base, style];
};

const paddingClassFor = (padding: CardPadding): string => {
  if (padding === "none") return "";
  if (padding === "sm") return "p-3";
  if (padding === "lg") return "p-5";
  return "p-4";
};

const borderClassFor = ({
  selected,
  destructive,
}: {
  selected?: boolean;
  destructive?: boolean;
}): string => {
  if (destructive) return "border-destructive/60 dark:border-destructive-dark/60";
  if (selected) return "border-ink dark:border-ink-dark";
  return "border-line dark:border-line-dark";
};
