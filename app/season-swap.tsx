import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";

import { Screen } from "~/components/ui/Screen";
import { useBottomBarSpacing } from "~/components/ui/BottomBar";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { useSetItemsStored } from "~/features/closet/hooks/useSetItemsStored";
import { useActiveSeasons } from "~/features/closet/hooks/useActiveSeasons";
import { useItemWearCounts } from "~/features/wear/hooks/useItemWearCounts";
import { markSeasonHandled } from "~/features/closet/seasonSwapMemory";
import {
  planSeasonSwap,
  selectedMoves,
  selectionSize,
  swapMoveCount,
  unwornItemIds,
  type SeasonSwapSelection,
} from "~/features/closet/seasonSwap";
import { SeasonSwapIntro } from "~/features/closet/components/SeasonSwapIntro";
import { SwapItemGroup } from "~/features/closet/components/SwapItemGroup";
import { SeasonSwapEmptyState } from "~/features/closet/components/SeasonSwapEmptyState";
import { SeasonSwapBar } from "~/features/closet/components/SeasonSwapBar";
import type { Item, Season } from "~/types/items";

export default function SeasonSwapScreen() {
  const { session } = useAuth();
  const { data: items, isLoading } = useSignedItems(session?.user.id);
  const { data: wearCounts } = useItemWearCounts(session?.user.id);
  const detected = useActiveSeasons();
  const setItemsStored = useSetItemsStored();
  const bottomBarSpacing = useBottomBarSpacing();
  const [chosenSeasons, setChosenSeasons] = useState<Set<Season> | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const keepOutSeasons = useMemo(
    () => keepOutSeasonsFor(chosenSeasons, detected.activeSeasons),
    [chosenSeasons, detected.activeSeasons],
  );
  const plan = useMemo(
    () => planSeasonSwap(itemsOrEmpty(items), [...keepOutSeasons]),
    [items, keepOutSeasons],
  );
  const unwornIds = useMemo(
    () => unwornItemIds(plan.packAway, wearCounts, new Date()),
    [plan, wearCounts],
  );
  const selection = selectedMoves(plan, skippedIds);

  const toggleSeason = (season: Season) => {
    setChosenSeasons(toggledInSet(keepOutSeasons, season));
  };

  const toggleItem = (item: Item) => {
    setSkippedIds((current) => toggledInSet(current, item.id));
  };

  const confirmSwap = () => {
    setItemsStored.mutate(selection, {
      onSuccess: () => {
        markSeasonHandled(detected.seasonKey);
        toast.success(swapToastText(selection));
        router.back();
      },
    });
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomBarSpacing }}>
        <SeasonSwapIntro
          calendarSeason={detected.calendarSeason}
          tempC={detected.tempC}
          keepOutSeasons={keepOutSeasons}
          onToggleSeason={toggleSeason}
        />
        {swapMoveCount(plan) === 0 && <SeasonSwapEmptyState />}
        <SwapItemGroup
          title="Pack away"
          subtitle="Tagged only for seasons you're not keeping out."
          items={plan.packAway}
          skippedIds={skippedIds}
          unwornIds={unwornIds}
          onToggleItem={toggleItem}
        />
        <SwapItemGroup
          title="Bring out"
          subtitle="In storage, and right for the seasons ahead."
          items={plan.bringOut}
          skippedIds={skippedIds}
          unwornIds={EMPTY_IDS}
          onToggleItem={toggleItem}
        />
      </ScrollView>
      <SeasonSwapBar
        moveCount={selectionSize(selection)}
        saving={setItemsStored.isPending}
        onConfirm={confirmSwap}
      />
    </Screen>
  );
}

const EMPTY_IDS: ReadonlySet<string> = new Set();

// Until the user touches the season pills, follow what the calendar and
// weather suggest — so a late weather fetch still updates the plan.
const keepOutSeasonsFor = (
  chosen: Set<Season> | null,
  detected: Season[],
): Set<Season> => {
  if (chosen !== null) return chosen;
  return new Set(detected);
};

const toggledInSet = <Value,>(current: ReadonlySet<Value>, value: Value): Set<Value> => {
  const next = new Set(current);
  if (next.has(value)) {
    next.delete(value);
    return next;
  }
  next.add(value);
  return next;
};

const itemsOrEmpty = (items: Item[] | undefined): Item[] => {
  if (!items) return [];
  return items;
};

const swapToastText = (selection: SeasonSwapSelection): string => {
  const parts: string[] = [];
  const storedCount = selection.storeItemIds.length;
  const returnedCount = selection.returnItemIds.length;
  if (storedCount > 0) parts.push(`${storedCount} packed away`);
  if (returnedCount > 0) parts.push(`${returnedCount} brought out`);
  return parts.join(" · ");
};

