// Save is a deliberate "I love this" — heavier than wear which can be casual.
// Dismiss is a deliberate "no" — sharper than the gentle nudge from skipping.
export const PAIR_AFFINITY = {
  saveDelta: 1.0,
  wearDelta: 0.4,
  dismissDelta: -0.3,
  // Cap so a single runaway favourite can't dominate scoring.
  min: -2,
  max: 2,
};

// 3 is neutral; 1 is strongly negative, 5 strongly positive.
export const ratingToMultiplier = (rating: number): number => {
  return (rating - 3) / 2;
};

// Encourage variety — items worn recently get a temporary score nudge down.
// The window is short on purpose: after a few days an item should feel fresh again.
export const RECENCY = {
  windowDays: 14,
  // Penalty per item by how many days ago it was last worn.
  // 0 = today, 1 = yesterday. Items beyond this list contribute no penalty.
  penaltyByDaysAgo: [10, 7, 5, 3] as const,
  // Cap the total per-outfit penalty so an entirely-recent outfit doesn't crash to zero.
  maxOutfitPenalty: 20,
};

export const recencyPenaltyForDaysAgo = (daysAgo: number): number => {
  if (daysAgo < 0) return 0;
  if (daysAgo >= RECENCY.penaltyByDaysAgo.length) return 0;
  return RECENCY.penaltyByDaysAgo[daysAgo];
};
