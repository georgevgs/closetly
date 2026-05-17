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
// The previous 14-day window had a hard cliff: a sweater worn 15 days ago
// looked identical to one never worn. The new curve uses exponential decay
// so the penalty fades smoothly out to ~60 days, giving the algorithm useful
// signal for a full season of wear history.
export const RECENCY = {
  windowDays: 60,
  // Penalty for an item worn today, decaying exponentially. We tune halfLife
  // so an item worn ~14 days ago has roughly a quarter of its initial bite.
  initialPenalty: 5,
  halfLifeDays: 7,
  maxOutfitPenalty: 18,
};

export const recencyPenaltyForDaysAgo = (daysAgo: number): number => {
  if (daysAgo < 0) return 0;
  if (daysAgo >= RECENCY.windowDays) return 0;
  const decay = Math.exp(-(daysAgo * Math.LN2) / RECENCY.halfLifeDays);
  const raw = RECENCY.initialPenalty * decay;
  if (raw < 0.25) return 0;
  return raw;
};

// Core-wardrobe nudge: items worn many times are reliable favorites. We
// reward outfits that lean on them using log-scaled bonuses so a 30×-worn
// piece doesn't dominate over a 5×-worn one.
export const CORE_WARDROBE = {
  // Per-item bonus = factor * log2(1 + wearCount). cap keeps a runaway
  // favorite from drowning out novel combinations.
  factor: 0.8,
  perItemCap: 3,
  outfitCap: 8,
};

export const coreWardrobeBonusFor = (wearCount: number): number => {
  if (wearCount <= 0) return 0;
  const raw = CORE_WARDROBE.factor * Math.log2(1 + wearCount);
  if (raw > CORE_WARDROBE.perItemCap) return CORE_WARDROBE.perItemCap;
  return raw;
};

// User style preference: small lift when an outfit's items match the vibes
// the user picked at onboarding. Cold-start signal for new users with no
// affinity data yet.
export const STYLE_PREFERENCE = {
  perItemBonus: 1.5,
  outfitCap: 5,
};
