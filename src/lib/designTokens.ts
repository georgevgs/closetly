import type { SymbolViewProps } from "expo-symbols";

export const spacing = {
  chromeEdge: 12,
  chromeY: 12,
  groupGap: 8,
  innerGap: 4,
  screenX: 20,
  screenY: 16,
  stackMd: 20,
  stackSm: 12,
  rowGap: 8,
  touchTarget: 44,
} as const;

export const radii = {
  pill: 9999,
  card: 16,
  field: 12,
  row: 12,
  sheet: 20,
} as const;

type SymbolDescriptor = {
  size: number;
  weight: SymbolViewProps["weight"];
};

export const symbolStyles = {
  chromePrimary: { size: 18, weight: "semibold" } satisfies SymbolDescriptor,
  chromeSecondary: { size: 16, weight: "medium" } satisfies SymbolDescriptor,
  contentIcon: { size: 20, weight: "regular" } satisfies SymbolDescriptor,
} as const;

export const intentColors = {
  success: "#7d8a6a",
  successDark: "#9aa685",
  destructive: "#a85a3b",
  destructiveDark: "#d18a6c",
  placeholder: "#a8a29e",
  muted: "#78716c",
} as const;

export const scoreToneColors = {
  okBackground: "#e5edd8",
  midBackground: "#f1e6d8",
  lowBackground: "#f0d9d3",
} as const;
