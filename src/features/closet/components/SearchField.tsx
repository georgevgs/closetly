import { TextInput } from "react-native";
import { useColorScheme } from "nativewind";
import { SymbolView } from "expo-symbols";

import { GlassSurface } from "~/components/ui/GlassSurface";
import { PressableScale } from "~/components/ui/PressableScale";
import { intentColors, spacing, symbolStyles } from "~/lib/designTokens";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function SearchField({ value, onChange }: Props) {
  const showClear = value.length > 0;
  const { colorScheme } = useColorScheme();
  const keyboardAppearance = keyboardAppearanceFor(colorScheme);

  return (
    <GlassSurface
      variant="capsule"
      style={{
        flex: 1,
        height: spacing.touchTarget,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
      fallbackClassName="bg-canvas/70 dark:bg-canvas-dark/70 border border-line dark:border-line-dark"
    >
      <SymbolView
        name="magnifyingglass"
        size={symbolStyles.chromeSecondary.size}
        tintColor={intentColors.placeholder}
        weight={symbolStyles.chromeSecondary.weight}
      />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search by name or brand"
        placeholderTextColor={intentColors.placeholder}
        className="flex-1 text-ink dark:text-ink-dark"
        returnKeyType="search"
        keyboardAppearance={keyboardAppearance}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        maxFontSizeMultiplier={1.4}
      />
      {showClear && (
        <PressableScale
          onPress={() => onChange("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <SymbolView
            name="xmark.circle.fill"
            size={symbolStyles.chromeSecondary.size}
            tintColor={intentColors.placeholder}
          />
        </PressableScale>
      )}
    </GlassSurface>
  );
}

const keyboardAppearanceFor = (
  colorScheme: "light" | "dark" | null | undefined,
): "light" | "dark" => {
  if (colorScheme === "dark") return "dark";
  return "light";
};
