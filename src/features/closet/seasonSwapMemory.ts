import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Remembers which calendar season the user already swapped for (or
// dismissed the prompt in), so the home-screen nudge appears once per season
// instead of nagging every time a stray summer piece is kept out on purpose.
const STORAGE_KEY = "closetly:seasonSwap:handledSeasonKey";

export type SeasonSwapMemory = {
  hydrated: boolean;
  handledSeasonKey: string | null;
};

let snapshot: SeasonSwapMemory = { hydrated: false, handledSeasonKey: null };
const subscribers = new Set<() => void>();

const notify = (): void => {
  for (const subscriber of subscribers) subscriber();
};

const hydrate = async (): Promise<void> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  snapshot = { hydrated: true, handledSeasonKey: stored };
  notify();
};

hydrate();

export const markSeasonHandled = async (seasonKey: string): Promise<void> => {
  snapshot = { hydrated: true, handledSeasonKey: seasonKey };
  notify();
  await AsyncStorage.setItem(STORAGE_KEY, seasonKey);
};

const subscribe = (listener: () => void): (() => void) => {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
};

const getSnapshot = (): SeasonSwapMemory => snapshot;

export const useSeasonSwapMemory = (): SeasonSwapMemory => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
