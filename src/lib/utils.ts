import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Narrow optional → nullable at DB / API boundaries without reaching for `??`.
export const orNull = <T>(value: T | undefined): T | null => {
  if (value === undefined) return null;
  return value;
};

export type ColorScheme = "light" | "dark" | null | undefined;

// Single source of truth for the on-canvas foreground hex used by SymbolView
// tints. Keeping this in one place stops the four-call-site ternary from
// drifting if the palette ever changes.
export const foregroundFor = (scheme: ColorScheme): string => {
  if (scheme === "dark") return "#f5f3ef";
  return "#1a1a1a";
};

export const toasterThemeFor = (scheme: ColorScheme): "light" | "dark" => {
  if (scheme === "dark") return "dark";
  return "light";
};
