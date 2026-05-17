import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

import type { OutfitSuggestion } from "~/lib/outfit/combinator";

// Scoring runs hundreds of combinations per anchor. We defer it to after the
// current interaction so navigation/scroll stays at 60fps; the `cancelled`
// guard prevents stale results from landing if dependencies change mid-compute.
export const useDeferredSuggestions = <Inputs,>(
  inputs: Inputs,
  compute: (inputs: Inputs) => OutfitSuggestion[],
  dependencies: readonly unknown[],
): { suggestions: OutfitSuggestion[]; isComputing: boolean } => {
  const [suggestions, setSuggestions] = useState<OutfitSuggestion[]>([]);
  const [isComputing, setIsComputing] = useState(true);

  useEffect(() => {
    setIsComputing(true);
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const computed = compute(inputs);
      setSuggestions(computed);
      setIsComputing(false);
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { suggestions, isComputing };
};
