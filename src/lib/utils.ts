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
