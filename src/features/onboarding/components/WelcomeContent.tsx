import { View } from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useColorScheme } from "nativewind";

import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";

type Highlight = {
  icon: SymbolViewProps["name"];
  title: string;
  body: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: "camera",
    title: "Photograph your closet",
    body: "Snap each piece once. Closetly auto-detects colors and trims the background.",
  },
  {
    icon: "sparkles",
    title: "Outfits that fit today",
    body: "Get suggestions tuned to the weather and what you've actually worn lately.",
  },
  {
    icon: "suitcase",
    title: "Pack smarter trips",
    body: "Build capsules from your real wardrobe, not a guess at what you might bring.",
  },
];

export function WelcomeContent({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <View className="flex-1 px-6 py-12 justify-between">
      <View>
        <Text variant="display">Welcome to Closetly</Text>
        <Text variant="caption" className="mt-2">
          A calmer way to dress from what you already own.
        </Text>
      </View>

      <View className="gap-6">
        {HIGHLIGHTS.map((highlight) => (
          <HighlightRow key={highlight.title} highlight={highlight} />
        ))}
      </View>

      <Button label="Get started" size="lg" onPress={onGetStarted} />
    </View>
  );
}

function HighlightRow({ highlight }: { highlight: Highlight }) {
  const { colorScheme } = useColorScheme();
  const tint = iconTintForScheme(colorScheme);
  return (
    <View className="flex-row gap-4">
      <View className="w-10 h-10 rounded-full items-center justify-center bg-line dark:bg-line-dark">
        <SymbolView name={highlight.icon} size={20} tintColor={tint} />
      </View>
      <View className="flex-1">
        <Text variant="headline">{highlight.title}</Text>
        <Text variant="caption" className="mt-1 leading-5">
          {highlight.body}
        </Text>
      </View>
    </View>
  );
}

const iconTintForScheme = (scheme: string | null | undefined): string => {
  if (scheme === "dark") return "#f5f3ef";
  return "#1a1a1a";
};
