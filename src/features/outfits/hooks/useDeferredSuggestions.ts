import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

import type { OutfitSuggestion } from "~/lib/outfit/combinator";

// Scoring runs hundreds of combinations per anchor. We defer it to after the
// current interaction so navigation/scroll stays at 60fps; the `cancelled`
// guard prevents stale results from landing if dependencies change mid-compute.
//
// `isComputing` is derived from comparing the last-computed deps against the
// current ones, so we don't need a setState call inside the effect body.
export const useDeferredSuggestions = <Inputs,>(
  inputs: Inputs,
  compute: (inputs: Inputs) => OutfitSuggestion[],
  dependencies: readonly unknown[],
): { suggestions: OutfitSuggestion[]; isComputing: boolean } => {
  const [result, setResult] = useState<{
    suggestions: OutfitSuggestion[];
    deps: readonly unknown[];
  }>({ suggestions: [], deps: [] });

  useEffect(() => {
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      const computed = compute(inputs);
      setResult({ suggestions: computed, deps: dependencies });
    });
    return () => {
      cancelled = true;
      handle.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const isComputing = !depsEqual(result.deps, dependencies);
  return { suggestions: result.suggestions, isComputing };
};

const depsEqual = (
  previous: readonly unknown[],
  next: readonly unknown[],
): boolean => {
  if (previous === next) return true;
  if (previous.length !== next.length) return false;
  for (let index = 0; index < previous.length; index += 1) {
    if (!Object.is(previous[index], next[index])) return false;
  }
  return true;
};
