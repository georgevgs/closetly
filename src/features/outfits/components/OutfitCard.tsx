import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Text } from "~/components/ui/Text";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";

export function OutfitCard({
  outfit,
  saved,
  onSave,
}: {
  outfit: OutfitSuggestion;
  saved?: boolean;
  onSave?: () => void;
}) {
  return (
    <View className="rounded-xl border border-line dark:border-line-dark p-4 bg-white dark:bg-[#1a1816]">
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
            {outfit.items.flatMap((it) =>
              it.colors.slice(0, 1).map((c, i) => (
                <View
                  key={it.id + i}
                  className="w-5 h-5 rounded-full border border-line"
                  style={{ backgroundColor: c.hex }}
                />
              ))
            )}
          </View>
          {onSave && (
            <Pressable onPress={onSave} hitSlop={12} className="ml-1">
              <SymbolView
                name={saved ? "heart.fill" : "heart"}
                size={22}
                tintColor={saved ? "#a85a3b" : "#78716c"}
              />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row gap-2">
        {outfit.items.map((it) => (
          <View
            key={it.id}
            style={{ flex: 1, aspectRatio: 0.75 }}
            className="rounded-lg overflow-hidden bg-canvas dark:bg-canvas-dark"
          >
            <Image
              source={{ uri: it.thumb_url ?? it.photo_url }}
              style={{ flex: 1 }}
              contentFit="cover"
            />
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row flex-wrap gap-1.5">
        <ScoreChip label="Color" value={outfit.score.color} />
        <ScoreChip label="Style" value={outfit.score.style} />
        <ScoreChip label="Formality" value={outfit.score.formality} />
        <ScoreChip label="Pattern" value={outfit.score.pattern} />
      </View>

      {outfit.score.notes.length > 0 && (
        <View className="mt-3">
          {outfit.score.notes.slice(0, 2).map((n, i) => (
            <Text key={i} variant="caption">
              {"• "}{n}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "ok" : value >= 60 ? "mid" : "low";
  return (
    <View
      className="px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: tone === "ok" ? "#e5edd8" : tone === "mid" ? "#f1e6d8" : "#f0d9d3",
      }}
    >
      <Text variant="caption" className="text-ink">
        {label} {value}
      </Text>
    </View>
  );
}
