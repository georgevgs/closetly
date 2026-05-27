import { GlassSurface } from "./GlassSurface";
import { Text } from "./Text";
import { spacing } from "../../lib/designTokens";

type Props = {
  label: string;
};

export function ScreenTitlePill({ label }: Props) {
  return (
    <GlassSurface
      variant="capsule"
      style={{
        height: spacing.touchTarget,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
      }}
      fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line dark:border-line-dark"
    >
      <Text variant="titlePill">{label}</Text>
    </GlassSurface>
  );
}
