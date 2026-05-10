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
  handleSave: (suggestion: OutfitSuggestion, key: string) => Promise<void>;
  handleWear: (suggestion: OutfitSuggestion, key: string) => Promise<void>;
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

  const handleSave = async (suggestion: OutfitSuggestion, key: string) => {
    if (savedKeys.has(key)) return;
    await save.mutateAsync({ items: suggestion.items, favorite: true, rating: 5 });
    setSavedKeys((previous) => addTo(previous, key));
    toast.success("Saved to favorites");
  };

  const handleWear = async (suggestion: OutfitSuggestion, key: string) => {
    if (wornKeys.has(key)) return;
    await wear.mutateAsync({ items: suggestion.items, weather });
    setWornKeys((previous) => addTo(previous, key));
    toast.success("Logged for today");
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
