import type { OutfitSuggestion } from "./combinator";

// Per-item reuse cost when ranking the day's outfits. Small enough that a
// truly stronger outfit still wins, large enough that "same top, different
// shoes" gets bumped behind a fresher combination. Tuned against typical
// 65–95 total-score range.
const DIVERSITY_PENALTY_PER_REPEAT = 8;

// Light score jitter so close-scoring outfits can swap order between days.
// Recommender-system "temperature" — the user perceives variety even when
// the underlying scores barely moved.
const JITTER_RANGE = 5;

export type DiversePickerOptions = {
  candidates: OutfitSuggestion[];
  count: number;
  random?: () => number;
};

export const pickDiverseOutfits = (
  opts: DiversePickerOptions,
): OutfitSuggestion[] => {
  if (opts.candidates.length === 0) return [];
  const jittered = jitterScores(opts.candidates, opts.random);
  return runDiversityReranking(jittered, opts.count);
};

type JitteredCandidate = {
  suggestion: OutfitSuggestion;
  jitteredScore: number;
};

const jitterScores = (
  candidates: OutfitSuggestion[],
  random: (() => number) | undefined,
): JitteredCandidate[] => {
  return candidates.map((suggestion) => {
    const offset = jitterOffsetFor(random);
    return { suggestion, jitteredScore: suggestion.score.rawTotal + offset };
  });
};

const jitterOffsetFor = (random: (() => number) | undefined): number => {
  if (random === undefined) return 0;
  return (random() * 2 - 1) * JITTER_RANGE;
};

const runDiversityReranking = (
  jittered: JitteredCandidate[],
  count: number,
): OutfitSuggestion[] => {
  const remaining = [...jittered];
  const picked: OutfitSuggestion[] = [];
  const usageCount = new Map<string, number>();

  while (picked.length < count && remaining.length > 0) {
    const bestIndex = findBestAdjustedIndex(remaining, usageCount);
    if (bestIndex === -1) break;
    const [chosen] = remaining.splice(bestIndex, 1);
    picked.push(chosen.suggestion);
    trackItemUsage(usageCount, chosen.suggestion);
  }

  return picked;
};

const findBestAdjustedIndex = (
  remaining: JitteredCandidate[],
  usageCount: Map<string, number>,
): number => {
  let bestIndex = -1;
  let bestAdjusted = -Infinity;
  for (let candidateIndex = 0; candidateIndex < remaining.length; candidateIndex++) {
    const adjusted = adjustForDiversity(remaining[candidateIndex], usageCount);
    if (adjusted > bestAdjusted) {
      bestAdjusted = adjusted;
      bestIndex = candidateIndex;
    }
  }
  return bestIndex;
};

const adjustForDiversity = (
  candidate: JitteredCandidate,
  usageCount: Map<string, number>,
): number => {
  let penalty = 0;
  for (const item of candidate.suggestion.items) {
    const reuseCount = usageCount.get(item.id);
    if (reuseCount === undefined) continue;
    penalty += reuseCount * DIVERSITY_PENALTY_PER_REPEAT;
  }
  return candidate.jitteredScore - penalty;
};

const trackItemUsage = (
  usageCount: Map<string, number>,
  suggestion: OutfitSuggestion,
): void => {
  for (const item of suggestion.items) {
    const previous = usageCount.get(item.id);
    if (previous === undefined) {
      usageCount.set(item.id, 1);
      continue;
    }
    usageCount.set(item.id, previous + 1);
  }
};
