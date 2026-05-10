import { supabase } from "~/lib/supabase";
import type { Json } from "~/types/database";
import { PAIR_AFFINITY } from "./tuning";

// item_a < item_b is enforced by the table check, so callers shouldn't sort.
type PairEdge = {
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

  const pairs = pairEdges(itemIds);
  const { error } = await supabase.rpc("bump_pair_affinity", {
    p_user_id: userId,
    p_pairs: pairs as unknown as Json,
    p_delta: delta,
    p_min: PAIR_AFFINITY.min,
    p_max: PAIR_AFFINITY.max,
  });
  if (error) throw error;
};

const pairEdges = (itemIds: string[]): PairEdge[] => {
  const edges: PairEdge[] = [];
  itemIds.forEach((firstId, firstIndex) => {
    const remaining = itemIds.slice(firstIndex + 1);
    for (const secondId of remaining) {
      const [orderedFirst, orderedSecond] = orderedPair(firstId, secondId);
      edges.push({ item_a: orderedFirst, item_b: orderedSecond });
    }
  });
  return edges;
};

const orderedPair = (firstId: string, secondId: string): [string, string] => {
  if (firstId < secondId) return [firstId, secondId];
  return [secondId, firstId];
};
