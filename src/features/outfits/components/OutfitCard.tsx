import { View } from "react-native";
import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import { Card } from "~/components/ui/Card";
import { PressableScale } from "~/components/ui/PressableScale";
import { intentColors, scoreToneColors } from "~/lib/designTokens";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";
import type { Item } from "~/types/items";

export function OutfitCard({
  outfit,
  saved,
  worn,
  onSave,
  onWear,
  onDismiss,
}: {
  outfit: OutfitSuggestion;
  saved?: boolean;
  worn?: boolean;
  onSave?: () => void;
  onWear?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <Card padding="md">
      <View className="flex-row justify-between items-start mb-3">
        <View>
          <Text variant="caption" className="uppercase tracking-widest">
            Match
          </Text>
          <Text variant="title" className="mt-0.5">
            {outfit.score.total}
            <Text variant="caption">/100</Text>
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1">
            {outfit.items.flatMap((item) =>
              item.colors.slice(0, 1).map((color, colorIndex) => (
                <View
                  key={item.id + colorIndex}
                  className="w-5 h-5 rounded-full border border-line"
                  style={{ backgroundColor: color.hex }}
                />
              ))
            )}
          </View>
          {onDismiss && <DismissButton onPress={onDismiss} />}
          {onWear && <WearButton worn={worn} onPress={onWear} />}
          {onSave && <SaveButton saved={saved} onPress={onSave} />}
        </View>
      </View>

      <View className="flex-row gap-2">
        {outfit.items.map((item) => (
          <View
            key={item.id}
            style={{ flex: 1, aspectRatio: 0.75 }}
            className="rounded-lg overflow-hidden bg-canvas dark:bg-canvas-dark"
          >
            <Image
              source={{ uri: imageSource(item) }}
              recyclingKey={imageSource(item)}
              style={{ flex: 1 }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        <ScoreChip label="Color" value={outfit.score.color} />
        {outfit.score.proportion !== null && (
          <ScoreChip label="Palette" value={outfit.score.proportion} />
        )}
        <ScoreChip label="Style" value={outfit.score.style} />
        <ScoreChip label="Formality" value={outfit.score.formality} />
        {outfit.score.balance !== null && (
          <ScoreChip label="Balance" value={outfit.score.balance} />
        )}
        {outfit.score.weather !== null && (
          <ScoreChip label="Weather" value={outfit.score.weather} />
        )}
        <ScoreChip label="Pattern" value={outfit.score.pattern} />
      </View>

      {outfit.score.notes.length > 0 && (
        <View className="mt-3">
          {outfit.score.notes.slice(0, 2).map((note, noteIndex) => (
            <Text key={noteIndex} variant="caption">
              {"• "}{note}
            </Text>
          ))}
        </View>
      )}
    </Card>
  );
}

function WearButton({ worn, onPress }: { worn?: boolean; onPress: () => void }) {
  const icon = pickWearIcon(worn);
  const tint = pickWearTint(worn);
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={wearAccessibilityLabel(worn)}
    >
      <SymbolView name={icon} size={22} tintColor={tint} />
    </PressableScale>
  );
}

const wearAccessibilityLabel = (worn: boolean | undefined): string => {
  if (worn) return "Marked as worn today";
  return "Wear today";
};

const pickWearIcon = (worn?: boolean): SymbolViewProps["name"] => {
  if (worn) return "checkmark.circle.fill";
  return "tshirt";
};

const pickWearTint = (worn?: boolean): string => {
  if (worn) return intentColors.success;
  return intentColors.muted;
};

function DismissButton({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Dismiss suggestion"
    >
      <SymbolView name="xmark.circle" size={22} tintColor={intentColors.muted} />
    </PressableScale>
  );
}

function SaveButton({ saved, onPress }: { saved?: boolean; onPress: () => void }) {
  const icon = pickHeartIcon(saved);
  const tint = pickHeartTint(saved);
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={saveAccessibilityLabel(saved)}
      className="ml-1"
    >
      <SymbolView name={icon} size={22} tintColor={tint} />
    </PressableScale>
  );
}

const saveAccessibilityLabel = (saved: boolean | undefined): string => {
  if (saved) return "Remove from favorites";
  return "Save to favorites";
};

const pickHeartIcon = (saved?: boolean): SymbolViewProps["name"] => {
  if (saved) return "heart.fill";
  return "heart";
};

const pickHeartTint = (saved?: boolean): string => {
  if (saved) return intentColors.destructive;
  return intentColors.muted;
};

type ChipTone = "ok" | "mid" | "low";

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = chipToneFor(value);
  const background = chipBackground(tone);
  return (
    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: background }}>
      <Text variant="caption" className="text-ink">
        {label} {value}
      </Text>
    </View>
  );
}

const chipToneFor = (value: number): ChipTone => {
  if (value >= 80) return "ok";
  if (value >= 60) return "mid";
  return "low";
};

const chipBackground = (tone: ChipTone): string => {
  if (tone === "ok") return scoreToneColors.okBackground;
  if (tone === "mid") return scoreToneColors.midBackground;
  return scoreToneColors.lowBackground;
};

const imageSource = (item: Item): string => {
  if (item.thumb_url) return item.thumb_url;
  return item.photo_url;
};
