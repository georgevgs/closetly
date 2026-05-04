import { Text as RNText, type TextProps } from "react-native";
import { cn } from "../../lib/utils";

type Variant = "display" | "title" | "headline" | "body" | "caption" | "label";

const variants: Record<Variant, string> = {
  display: "font-display text-4xl text-ink dark:text-ink-dark tracking-tight",
  title: "font-display text-2xl text-ink dark:text-ink-dark",
  headline: "text-lg font-semibold text-ink dark:text-ink-dark",
  body: "text-base text-ink dark:text-ink-dark",
  caption: "text-xs text-muted dark:text-muted-dark",
  label: "text-sm font-medium text-ink dark:text-ink-dark uppercase tracking-wider",
};

export function Text({
  variant = "body",
  className,
  ...props
}: TextProps & { variant?: Variant; className?: string }) {
  return <RNText className={cn(variants[variant], className)} {...props} />;
}
