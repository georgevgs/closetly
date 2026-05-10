import { useState } from "react";
import { toast } from "sonner-native";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";
import type { WeatherSnapshot } from "~/features/weather/useWeather";
import { useLogWear } from "~/features/wear/hooks/useLogWear";
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
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [wornKeys, setWornKeys] = useState<Set<string>>(new Set());
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  const handleSave = (suggestion: OutfitSuggestion, key: string) => {
    if (savedKeys.has(key)) return;
    save.mutate(
      { items: suggestion.items, favorite: true, rating: 5 },
      {
        onSuccess: () => {
          setSavedKeys((previous) => addTo(previous, key));
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
          setWornKeys((previous) => addTo(previous, key));
          toast.success("Logged for today");
        },
      },
    );
  };

  const handleDismiss = (suggestion: OutfitSuggestion, key: string) => {
    if (dismissedKeys.has(key)) return;
    setDismissedKeys((previous) => addTo(previous, key));
    dismiss.mutate({ items: suggestion.items });
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

const addTo = (set: Set<string>, key: string): Set<string> => {
  const next = new Set(set);
  next.add(key);
  return next;
};
