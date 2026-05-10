import { View } from "react-native";
import { Text } from "~/components/ui/Text";
import { OutfitCard } from "./OutfitCard";
import type { OutfitSuggestion } from "~/lib/outfit/combinator";

type SuggestionHandler = (suggestion: OutfitSuggestion, key: string) => void;

export function SuggestionsList({
  suggestions,
  savedKeys,
  wornKeys,
  dismissedKeys,
  onSave,
  onWear,
  onDismiss,
}: {
  suggestions: OutfitSuggestion[];
  savedKeys: Set<string>;
  wornKeys: Set<string>;
  dismissedKeys: Set<string>;
  onSave: SuggestionHandler;
  onWear: SuggestionHandler;
  onDismiss: SuggestionHandler;
}) {
  const visible = suggestions.filter(
    (suggestion) => !dismissedKeys.has(suggestionKey(suggestion)),
  );

  if (visible.length === 0) {
    return <EmptyState hasAnySuggestions={suggestions.length > 0} />;
  }

  return (
    <>
      {visible.map((suggestion) => {
        const key = suggestionKey(suggestion);
        return (
          <OutfitCard
            key={key}
            outfit={suggestion}
            saved={savedKeys.has(key)}
            worn={wornKeys.has(key)}
            onSave={() => onSave(suggestion, key)}
            onWear={() => onWear(suggestion, key)}
            onDismiss={() => onDismiss(suggestion, key)}
          />
        );
      })}
    </>
  );
}

function EmptyState({ hasAnySuggestions }: { hasAnySuggestions: boolean }) {
  if (hasAnySuggestions) {
    return (
      <View className="px-2 py-8">
        <Text variant="body">
          That's all of them — try a different anchor piece for fresh combinations.
        </Text>
      </View>
    );
  }
  return (
    <View className="px-2 py-8">
      <Text variant="body">
        Not enough matching pieces yet — add items from a different category.
      </Text>
    </View>
  );
}

const suggestionKey = (suggestion: OutfitSuggestion): string => {
  return suggestion.items
    .map((item) => item.id)
    .sort()
    .join("|");
};
