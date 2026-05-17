import { useMemo, useRef, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { router } from "expo-router";
import { toast } from "sonner-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Pill } from "~/components/ui/Pill";
import { KeyboardAvoider } from "~/components/ui/KeyboardAvoider";
import { useAuth } from "~/features/auth/context";
import { useSignedItems } from "~/features/closet/hooks/useSignedItems";
import { usePairAffinity } from "~/features/outfits/hooks/usePairAffinity";
import { useRecentWears } from "~/features/wear/hooks/useRecentWears";
import { useItemWearCounts } from "~/features/wear/hooks/useItemWearCounts";
import {
  usePreferredStyles,
  preferredStylesAsSet,
} from "~/features/profile/stylePreferences";
import { useWeather } from "~/features/weather/useWeather";
import { useSaveOutfit } from "~/features/outfits/hooks/useSaveOutfit";
import { useLogWear } from "~/features/wear/hooks/useLogWear";
import { useOutfitBuilder } from "~/features/outfits/hooks/useOutfitBuilder";
import { SlotTile } from "~/features/outfits/components/SlotTile";
import { SlotPickerSheet } from "~/features/outfits/components/SlotPickerSheet";
import { OutfitActionBar } from "~/features/outfits/components/OutfitActionBar";
import { toWeatherContext } from "~/features/outfits/weatherContext";
import { scoreOutfit, type ScoreBreakdown } from "~/lib/outfit/score";
import type { Category, Item } from "~/types/items";

const DEFAULT_VISIBLE_SLOTS: Category[] = ["top", "bottom", "shoes", "outerwear"];
const OPTIONAL_SLOTS: Category[] = ["dress", "bag", "hat", "accessory"];
const ADDABLE_LABELS: Record<Category, string> = {
  top: "+ Top",
  bottom: "+ Bottom",
  dress: "+ Dress",
  outerwear: "+ Outerwear",
  shoes: "+ Shoes",
  bag: "+ Bag",
  hat: "+ Hat",
  accessory: "+ Accessory",
};

export default function BuildOutfitScreen() {
  const { session } = useAuth();
  const { data: items } = useSignedItems(session?.user.id);
  const { data: weather } = useWeather();
  const { data: pairAffinity } = usePairAffinity(session?.user.id);
  const { data: recentlyWornItemIds } = useRecentWears(session?.user.id);
  const { data: itemWearCounts } = useItemWearCounts(session?.user.id);
  const preferredStylesList = usePreferredStyles();
  const preferredStyles = useMemo(
    () => preferredStylesAsSet(preferredStylesList),
    [preferredStylesList],
  );

  const builder = useOutfitBuilder();
  const save = useSaveOutfit();
  const wear = useLogWear();

  const [name, setName] = useState("");
  const [visibleSlots, setVisibleSlots] = useState<Category[]>(DEFAULT_VISIBLE_SLOTS);
  const [pickerSlot, setPickerSlot] = useState<Category | null>(null);
  const pickerRef = useRef<BottomSheetModal>(null);

  const addableSlots = OPTIONAL_SLOTS.filter(
    (slot) => !visibleSlots.includes(slot),
  );
  const addSlot = (slot: Category) => {
    setVisibleSlots((current) => [...current, slot]);
  };

  const openPickerFor = (slot: Category) => {
    setPickerSlot(slot);
    pickerRef.current?.present();
  };

  const handlePick = (item: Item) => {
    if (pickerSlot) builder.pickItem(pickerSlot, item);
    pickerRef.current?.dismiss();
  };

  const handleRemove = () => {
    if (pickerSlot) builder.removeSlot(pickerSlot);
    pickerRef.current?.dismiss();
  };

  const score = useMemo(() => {
    if (builder.selectedItems.length < 2) return null;
    return scoreOutfit(builder.selectedItems, {
      weather: toWeatherContext(weather),
      pairAffinity,
      recentlyWornItemIds,
      preferredStyles,
      itemWearCounts,
    });
  }, [
    builder.selectedItems,
    weather,
    pairAffinity,
    recentlyWornItemIds,
    preferredStyles,
    itemWearCounts,
  ]);

  const onSave = () => {
    save.mutate(
      {
        items: builder.selectedItems,
        name: trimmedNameOrUndefined(name),
        favorite: true,
        rating: 5,
      },
      {
        onSuccess: () => {
          toast.success("Saved to favorites");
          router.back();
        },
      },
    );
  };

  const onWear = () => {
    wear.mutate(
      { items: builder.selectedItems, weather },
      {
        onSuccess: () => {
          toast.success("Logged for today");
          router.back();
        },
      },
    );
  };

  return (
    <Screen edges={["bottom"]}>
      <KeyboardAvoider className="flex-1">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <NameField value={name} onChange={setName} />
        <ScoreBlock score={score} itemCount={builder.selectedItems.length} />
        <SlotGrid
          visibleSlots={visibleSlots}
          itemsBySlot={builder.itemsBySlot}
          onSlotPress={openPickerFor}
        />
        {addableSlots.length > 0 && (
          <AddSlotRow addable={addableSlots} onAdd={addSlot} />
        )}
      </ScrollView>

      <OutfitActionBar
        itemCount={builder.selectedItems.length}
        saving={save.isPending}
        wearing={wear.isPending}
        onSave={onSave}
        onWear={onWear}
      />

      <SlotPickerSheet
        ref={pickerRef}
        slot={pickerSlot}
        currentItem={lookupCurrent(builder.itemsBySlot, pickerSlot)}
        items={candidateItemsFor(items)}
        onPick={handlePick}
        onRemove={handleRemove}
      />
      </KeyboardAvoider>
    </Screen>
  );
}

function NameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View>
      <Text variant="label" className="mb-1">
        Name (optional)
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Friday brunch"
        placeholderTextColor="#a8a29e"
        className="h-12 px-4 rounded-lg border border-line dark:border-line-dark text-ink dark:text-ink-dark"
      />
    </View>
  );
}

function ScoreBlock({
  score,
  itemCount,
}: {
  score: ScoreBreakdown | null;
  itemCount: number;
}) {
  if (!score) return <ScorePlaceholder itemCount={itemCount} />;
  return (
    <View className="rounded-xl border border-line dark:border-line-dark p-4">
      <View className="flex-row items-baseline justify-between">
        <View>
          <Text variant="caption" className="uppercase tracking-widest">
            Match
          </Text>
          <Text variant="title">
            {score.total}
            <Text variant="caption">/100</Text>
          </Text>
        </View>
      </View>
      <ScoreChips score={score} />
      {score.notes.length > 0 && <ScoreNotes notes={score.notes} />}
    </View>
  );
}

function ScorePlaceholder({ itemCount }: { itemCount: number }) {
  return (
    <View className="rounded-xl border border-dashed border-line dark:border-line-dark p-4">
      <Text variant="caption" className="uppercase tracking-widest">
        Match
      </Text>
      <Text variant="body" className="mt-1">
        {placeholderMessage(itemCount)}
      </Text>
    </View>
  );
}

function ScoreChips({ score }: { score: ScoreBreakdown }) {
  return (
    <View className="mt-3 flex-row flex-wrap gap-1.5">
      <ScoreChip label="Color" value={score.color} />
      {score.proportion !== null && <ScoreChip label="Palette" value={score.proportion} />}
      <ScoreChip label="Style" value={score.style} />
      <ScoreChip label="Formality" value={score.formality} />
      {score.balance !== null && <ScoreChip label="Balance" value={score.balance} />}
      {score.weather !== null && <ScoreChip label="Weather" value={score.weather} />}
      <ScoreChip label="Pattern" value={score.pattern} />
    </View>
  );
}

function ScoreNotes({ notes }: { notes: string[] }) {
  return (
    <View className="mt-3">
      {notes.slice(0, 2).map((note, noteIndex) => (
        <Text key={noteIndex} variant="caption">
          {"• "}
          {note}
        </Text>
      ))}
    </View>
  );
}

type ChipTone = "ok" | "mid" | "low";

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = chipToneFor(value);
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{ backgroundColor: chipBackground(tone) }}
    >
      <Text variant="caption" className="text-ink">
        {label} {value}
      </Text>
    </View>
  );
}

function SlotGrid({
  visibleSlots,
  itemsBySlot,
  onSlotPress,
}: {
  visibleSlots: Category[];
  itemsBySlot: Map<Category, Item>;
  onSlotPress: (slot: Category) => void;
}) {
  return (
    <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
      {visibleSlots.map((slot) => (
        <View key={slot} style={{ width: "50%", padding: 4 }}>
          <SlotTile
            slot={slot}
            item={itemsBySlot.get(slot)}
            onPress={() => onSlotPress(slot)}
          />
        </View>
      ))}
    </View>
  );
}

function AddSlotRow({
  addable,
  onAdd,
}: {
  addable: Category[];
  onAdd: (slot: Category) => void;
}) {
  return (
    <View>
      <Text variant="label" className="mb-2">
        Add a slot
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {addable.map((slot) => (
          <Pill key={slot} label={ADDABLE_LABELS[slot]} onPress={() => onAdd(slot)} />
        ))}
      </View>
    </View>
  );
}

const trimmedNameOrUndefined = (raw: string): string | undefined => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  return trimmed;
};

const candidateItemsFor = (items: Item[] | undefined): Item[] => {
  if (!items) return [];
  return items;
};

const lookupCurrent = (
  itemsBySlot: Map<Category, Item>,
  slot: Category | null,
): Item | undefined => {
  if (slot === null) return undefined;
  return itemsBySlot.get(slot);
};

const placeholderMessage = (itemCount: number): string => {
  if (itemCount === 0) return "Pick a piece to start.";
  return "Add at least one more piece to see a match score.";
};

const chipToneFor = (value: number): ChipTone => {
  if (value >= 80) return "ok";
  if (value >= 60) return "mid";
  return "low";
};

const chipBackground = (tone: ChipTone): string => {
  if (tone === "ok") return "#e5edd8";
  if (tone === "mid") return "#f1e6d8";
  return "#f0d9d3";
};
