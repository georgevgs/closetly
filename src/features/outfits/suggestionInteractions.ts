import { create } from "zustand";

// Status the user has assigned to a suggestion within the current session.
// Lifted out of per-screen useState so wearing an outfit on the Today screen
// is reflected when the same outfit appears on the Suggest screen, and vice
// versa. Resets on a fresh app launch.
export type SuggestionStatus = {
  saved: boolean;
  worn: boolean;
  dismissed: boolean;
};

const EMPTY_STATUS: SuggestionStatus = {
  saved: false,
  worn: false,
  dismissed: false,
};

type SuggestionInteractionsState = {
  byKey: Map<string, SuggestionStatus>;
  markSaved: (key: string) => void;
  markWorn: (key: string) => void;
  markDismissed: (key: string) => void;
  reset: () => void;
};

export const useSuggestionInteractions = create<SuggestionInteractionsState>(
  (set) => ({
    byKey: new Map(),
    markSaved: (key) =>
      set((state) => ({ byKey: patchKey(state.byKey, key, { saved: true }) })),
    markWorn: (key) =>
      set((state) => ({ byKey: patchKey(state.byKey, key, { worn: true }) })),
    markDismissed: (key) =>
      set((state) => ({
        byKey: patchKey(state.byKey, key, { dismissed: true }),
      })),
    reset: () => set({ byKey: new Map() }),
  }),
);

const patchKey = (
  byKey: Map<string, SuggestionStatus>,
  key: string,
  patch: Partial<SuggestionStatus>,
): Map<string, SuggestionStatus> => {
  const next = new Map(byKey);
  next.set(key, { ...currentStatus(byKey, key), ...patch });
  return next;
};

const currentStatus = (
  byKey: Map<string, SuggestionStatus>,
  key: string,
): SuggestionStatus => {
  const existing = byKey.get(key);
  if (existing === undefined) return EMPTY_STATUS;
  return existing;
};
