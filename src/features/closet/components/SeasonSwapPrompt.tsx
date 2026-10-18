import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Haptics from "expo-haptics";

import { Card } from "~/components/ui/Card";
import { Text } from "~/components/ui/Text";
import { intentColors, spacing } from "~/lib/designTokens";
import { useActiveSeasons } from "~/features/closet/hooks/useActiveSeasons";
import { markSeasonHandled, useSeasonSwapMemory } from "~/features/closet/seasonSwapMemory";
import {
  planSeasonSwap,
  swapMoveCount,
  type SeasonSwapPlan,
} from "~/features/closet/seasonSwap";
import type { Item, Season } from "~/types/items";

// One or two stray pieces aren't worth interrupting the home screen for.
const MIN_MOVES_TO_NUDGE = 3;

export function SeasonSwapPrompt({ items }: { items: Item[] }) {
  const { activeSeasons, calendarSeason, seasonKey } = useActiveSeasons();
  const memory = useSeasonSwapMemory();
  const plan = useMemo(
    () => planSeasonSwap(items, activeSeasons),
    [items, activeSeasons],
  );

  if (!memory.hydrated) return null;
  if (memory.handledSeasonKey === seasonKey) return null;
  if (swapMoveCount(plan) < MIN_MOVES_TO_NUDGE) return null;

  const dismiss = () => {
    Haptics.selectionAsync();
    markSeasonHandled(seasonKey);
  };

  return (
    <View style={{ paddingHorizontal: spacing.screenX, marginTop: spacing.stackMd }}>
      <Pressable onPress={openSeasonSwap} accessibilityRole="button">
        <Card padding="md" className="flex-row items-center">
          <SymbolView
            name="arrow.triangle.2.circlepath"
            size={20}
            tintColor={intentColors.placeholder}
          />
          <View className="ml-3 flex-1">
            <Text variant="headline">Time for a season swap</Text>
            <Text variant="caption" className="mt-0.5">
              {nudgeMessage(plan, calendarSeason)}
            </Text>
          </View>
          <Pressable
            onPress={dismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Dismiss season swap reminder"
          >
            <SymbolView name="xmark" size={14} tintColor={intentColors.placeholder} />
          </Pressable>
        </Card>
      </Pressable>
    </View>
  );
}

const openSeasonSwap = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push("/season-swap");
};

const nudgeMessage = (plan: SeasonSwapPlan, calendarSeason: Season): string => {
  const parts: string[] = [];
  if (plan.packAway.length > 0) parts.push(`${plan.packAway.length} to pack away`);
  if (plan.bringOut.length > 0) parts.push(`${plan.bringOut.length} to bring out`);
  return `${parts.join(", ")} for ${calendarSeason}.`;
};
