import { Text as RNText, type TextProps } from "react-native";
import { cn } from "../../lib/utils";

type Variant =
  | "display"
  | "title"
  | "headline"
  | "body"
  | "caption"
  | "label"
  | "titlePill"
  | "badge";

const variants: Record<Variant, string> = {
  display: "font-display text-4xl text-ink dark:text-ink-dark tracking-tight",
  title: "font-display text-2xl text-ink dark:text-ink-dark",
  headline: "text-lg font-semibold text-ink dark:text-ink-dark",
  body: "text-base text-ink dark:text-ink-dark",
  caption: "text-sm text-muted dark:text-muted-dark",
  label: "text-sm font-medium text-ink dark:text-ink-dark uppercase tracking-wider",
  titlePill: "text-base font-semibold text-ink dark:text-ink-dark",
  badge: "text-xs font-semibold text-canvas dark:text-canvas-dark",
};

const FONT_SCALE_CAP: Record<Variant, number> = {
  display: 1.3,
  title: 1.3,
  headline: 1.4,
  body: 1.5,
  caption: 1.4,
  label: 1.3,
  titlePill: 1.3,
  badge: 1.2,
};

export function Text({
  variant = "body",
  className,
  maxFontSizeMultiplier,
  ...props
}: TextProps & { variant?: Variant; className?: string }) {
  return (
    <RNText
      className={cn(variants[variant], className)}
      maxFontSizeMultiplier={fontScaleCapFor(maxFontSizeMultiplier, variant)}
      {...props}
    />
  );
}

const fontScaleCapFor = (
  explicitCap: number | null | undefined,
  variant: Variant,
): number => {
  if (typeof explicitCap === "number") return explicitCap;
  return FONT_SCALE_CAP[variant];
};
