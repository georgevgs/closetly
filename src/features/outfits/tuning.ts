// Save / wear / dismiss are calibrated together so the algorithm responds to
// negative signal at roughly the same rate it does to positive signal. A
// rating-3 save is neutral; a rating-5 save (the "I love this" path used by
// the favourites button) sits just above the magnitude of a dismiss.
export const PAIR_AFFINITY = {
  saveDelta: 0.8,
  wearDelta: 0.3,
  dismissDelta: -0.5,
  // Cap so a single runaway favourite can't dominate scoring.
  min: -2,
  max: 2,
};

// 3 is neutral; 1 is strongly negative, 5 strongly positive.
export const ratingToMultiplier = (rating: number): number => {
  return (rating - 3) / 2;
};

// Encourage variety — items worn recently get a temporary score nudge down.
// The per-day curve is gentle enough that days inside the window produce
// distinguishable scores rather than all colliding at the cap. The cap exists
// so a four-piece outfit worn this morning can't single-handedly fall out of
// the suggestion list.
export const RECENCY = {
  windowDays: 14,
  // Penalty per item by how many days ago it was last worn.
  // 0 = today, 1 = yesterday. Items beyond this list contribute no penalty.
  penaltyByDaysAgo: [5, 4, 3, 2, 1, 1, 1] as const,
  maxOutfitPenalty: 18,
};

export const recencyPenaltyForDaysAgo = (daysAgo: number): number => {
  if (daysAgo < 0) return 0;
  if (daysAgo >= RECENCY.penaltyByDaysAgo.length) return 0;
  return RECENCY.penaltyByDaysAgo[daysAgo];
};
