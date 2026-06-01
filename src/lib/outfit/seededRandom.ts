// Deterministic PRNG so the day's outfit suggestions stay stable across
// re-renders and refreshes — but a fresh day rolls a new set. This is how
// recommenders like Discover Weekly avoid feeling robotic without going
// fully chaotic on every reload.

export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  if (state === 0) state = 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

// Encode the calendar date as YYYYMMDD so the invariant is obvious at a
// glance and doesn't depend on whether the source `Date` API is 0- or
// 1-indexed. Two distinct calendar dates always produce two distinct seeds;
// a single date always produces the same seed.
export const dailySeed = (now: Date = new Date()): number => {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return (year * 10000 + month * 100 + day) >>> 0;
};
