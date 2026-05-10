import { useMemo } from "react";
import { toast } from "sonner-native";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";
import type { WeatherSnapshot } from "~/features/weather/useWeather";
import { useLogWear } from "~/features/wear/hooks/useLogWear";
import {
  useSuggestionInteractions,
  type SuggestionStatus,
} from "~/features/outfits/suggestionInteractions";
import { useSaveOutfit } from "./useSaveOutfit";
import { useDismissSuggestion } from "./useDismissSuggestion";

export type OutfitActions = {
  savedKeys: Set<string>;
  wornKeys: Set<string>;
  dismissedKeys: Set<string>;
  handleSave: (suggestion: OutfitSuggestion, key: string) => void;
  handleWear: (suggestion: OutfitSuggestion, key: string) => void;
  handleDismiss: (suggestion: OutfitSuggestion, key: string) => void;
};

export function useOutfitActions(
  weather: WeatherSnapshot | null | undefined,
): OutfitActions {
  const save = useSaveOutfit();
  const wear = useLogWear();
  const dismiss = useDismissSuggestion();

  const byKey = useSuggestionInteractions((state) => state.byKey);
  const markSaved = useSuggestionInteractions((state) => state.markSaved);
  const markWorn = useSuggestionInteractions((state) => state.markWorn);
  const markDismissed = useSuggestionInteractions(
    (state) => state.markDismissed,
  );

  const savedKeys = useMemo(
    () => keysWhere(byKey, (status) => status.saved),
    [byKey],
  );
  const wornKeys = useMemo(
    () => keysWhere(byKey, (status) => status.worn),
    [byKey],
  );
  const dismissedKeys = useMemo(
    () => keysWhere(byKey, (status) => status.dismissed),
    [byKey],
  );

  const handleSave = (suggestion: OutfitSuggestion, key: string) => {
    if (savedKeys.has(key)) return;
    save.mutate(
      { items: suggestion.items, favorite: true, rating: 5 },
      {
        onSuccess: () => {
          markSaved(key);
          toast.success("Saved to favorites");
        },
      },
    );
  };

  const handleWear = (suggestion: OutfitSuggestion, key: string) => {
    if (wornKeys.has(key)) return;
    wear.mutate(
      { items: suggestion.items, weather },
      {
        onSuccess: () => {
          markWorn(key);
          toast.success("Logged for today");
        },
      },
    );
  };

  const handleDismiss = (suggestion: OutfitSuggestion, key: string) => {
    if (dismissedKeys.has(key)) return;
    dismiss.mutate(
      { items: suggestion.items },
      {
        onSuccess: () => markDismissed(key),
      },
    );
  };

  return {
    savedKeys,
    wornKeys,
    dismissedKeys,
    handleSave,
    handleWear,
    handleDismiss,
  };
}

const keysWhere = (
  byKey: Map<string, SuggestionStatus>,
  predicate: (status: SuggestionStatus) => boolean,
): Set<string> => {
  const result = new Set<string>();
  for (const [key, status] of byKey) {
    if (predicate(status)) result.add(key);
  }
  return result;
};
