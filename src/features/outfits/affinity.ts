import { supabase } from "~/lib/supabase";
import { PAIR_AFFINITY } from "./tuning";

// item_a < item_b is enforced by the table check, so callers shouldn't sort.
type PairEdge = {
  user_id: string;
  item_a: string;
  item_b: string;
};

export const bumpPairAffinity = async (
  userId: string,
  itemIds: string[],
  delta: number,
): Promise<void> => {
  if (delta === 0) return;
  if (itemIds.length < 2) return;

  const edges = pairEdges(userId, itemIds);
  for (const edge of edges) {
    await applyDelta(edge, delta);
  }
};

const pairEdges = (userId: string, itemIds: string[]): PairEdge[] => {
  const edges: PairEdge[] = [];
  itemIds.forEach((firstId, firstIndex) => {
    const remaining = itemIds.slice(firstIndex + 1);
    for (const secondId of remaining) {
      const [orderedFirst, orderedSecond] = orderedPair(firstId, secondId);
      edges.push({ user_id: userId, item_a: orderedFirst, item_b: orderedSecond });
    }
  });
  return edges;
};

const orderedPair = (firstId: string, secondId: string): [string, string] => {
  if (firstId < secondId) return [firstId, secondId];
  return [secondId, firstId];
};

const applyDelta = async (edge: PairEdge, delta: number): Promise<void> => {
  const { data: existing } = await supabase
    .from("item_pair_affinity")
    .select("affinity")
    .eq("user_id", edge.user_id)
    .eq("item_a", edge.item_a)
    .eq("item_b", edge.item_b)
    .maybeSingle();

  let next = delta;
  if (existing) next = existing.affinity + delta;
  next = clamp(next, PAIR_AFFINITY.min, PAIR_AFFINITY.max);

  await supabase
    .from("item_pair_affinity")
    .upsert({ ...edge, affinity: next });
};

const clamp = (value: number, low: number, high: number): number => {
  if (value < low) return low;
  if (value > high) return high;
  return value;
};
