import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { STYLES, type Style } from "~/types/items";

// Capped at 3 — past that the "preferences" start to mean nothing and the
// score boost saturates anyway.
export const MAX_PREFERRED_STYLES = 3;

const STORAGE_KEY = "closetly:profile:preferredStyles";

const isStyle = (value: string): value is Style => {
  return STYLES.includes(value as Style);
};

const parseStoredValue = (raw: string | null): Style[] => {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  const valid: Style[] = [];
  for (const value of parsed) {
    if (typeof value !== "string") continue;
    if (!isStyle(value)) continue;
    if (valid.includes(value)) continue;
    valid.push(value);
    if (valid.length >= MAX_PREFERRED_STYLES) break;
  }
  return valid;
};

const readStored = async (): Promise<Style[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return parseStoredValue(raw);
};

const writeStored = async (next: Style[]): Promise<void> => {
  if (next.length === 0) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

// Module-level cache + subscribers — the algorithm needs synchronous access
// (no React hook in the scoring path), and we want all hooks to react to
// edits made from any screen.
let cached: Style[] = [];
let hydrated = false;
const subscribers = new Set<() => void>();

const notify = (): void => {
  for (const subscriber of subscribers) subscriber();
};

const hydrate = async (): Promise<void> => {
  if (hydrated) return;
  cached = await readStored();
  hydrated = true;
  notify();
};

// Fire-and-forget hydrate on module load so the algorithm has the user's
// preferences ready by the time the home screen mounts.
hydrate();

export const setPreferredStyles = async (next: Style[]): Promise<void> => {
  const deduped = dedupeAndClamp(next);
  cached = deduped;
  await writeStored(deduped);
  notify();
};

const dedupeAndClamp = (input: Style[]): Style[] => {
  const result: Style[] = [];
  for (const style of input) {
    if (result.includes(style)) continue;
    result.push(style);
    if (result.length >= MAX_PREFERRED_STYLES) break;
  }
  return result;
};

export const togglePreferredStyle = async (style: Style): Promise<void> => {
  if (cached.includes(style)) {
    await setPreferredStyles(cached.filter((value) => value !== style));
    return;
  }
  if (cached.length >= MAX_PREFERRED_STYLES) return;
  await setPreferredStyles([...cached, style]);
};

const subscribe = (listener: () => void): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

const getSnapshot = (): Style[] => cached;

export const usePreferredStyles = (): Style[] => {
  return useSyncExternalStore(subscribe, getSnapshot);
};

// Synchronous Set view used by the scoring path. Recomputed in callers via
// useMemo against the hook output above so identity stays stable.
export const preferredStylesAsSet = (styles: Style[]): ReadonlySet<Style> => {
  return new Set(styles);
};
