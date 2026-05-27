import { View, type ViewProps, type ViewStyle } from "react-native";
import { GlassContainer, isGlassEffectAPIAvailable } from "expo-glass-effect";

type Props = ViewProps & {
  spacing?: number;
  children: React.ReactNode;
};

const liquidGlassAvailable = isGlassEffectAPIAvailable();

export function FloatingChromeGroup({
  spacing = 8,
  style,
  children,
  ...rest
}: Props) {
  const composedStyle = composeStyle(spacing, style);
  if (liquidGlassAvailable) {
    return (
      <GlassContainer spacing={spacing} style={composedStyle} {...rest}>
        {children}
      </GlassContainer>
    );
  }

  return (
    <View style={composedStyle} {...rest}>
      {children}
    </View>
  );
}

const composeStyle = (
  spacing: number,
  style: Props["style"],
): Props["style"] => {
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing,
  };
  if (style === undefined) return base;
  return [base, style];
};
