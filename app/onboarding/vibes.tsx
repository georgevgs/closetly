import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { useOnboarding } from "~/features/onboarding/context";
import {
  MAX_PREFERRED_STYLES,
  setPreferredStyles,
} from "~/features/profile/stylePreferences";
import { STYLES, type Style } from "~/types/items";

export default function VibesScreen() {
  const { markSeen } = useOnboarding();
  const [picked, setPicked] = useState<Style[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (style: Style) => {
    setPicked((previous) => nextPickedAfterToggle(previous, style));
  };

  const finish = async () => {
    setSaving(true);
    await setPreferredStyles(picked);
    await markSeen();
    setSaving(false);
    router.replace("/(app)");
  };

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40, gap: 24 }}>
        <View className="pt-4">
          <Text variant="caption" className="uppercase tracking-widest">
            One last thing
          </Text>
          <Text variant="display" className="mt-1">
            {"What's your vibe?"}
          </Text>
          <Text variant="body" className="mt-3">
            Pick up to {MAX_PREFERRED_STYLES} aesthetics so outfit suggestions
            lean into your taste from day one. You can change these later in
            Profile.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {STYLES.map((style) => (
            <Pill
              key={style}
              label={style}
              selected={picked.includes(style)}
              onPress={() => toggle(style)}
            />
          ))}
        </View>

        <Text variant="caption">{pickedSummary(picked)}</Text>
      </ScrollView>

      <View className="px-6 pb-6 gap-3">
        <Button
          label="Save and continue"
          onPress={finish}
          loading={saving}
          size="lg"
        />
        <Pressable onPress={finish} disabled={saving} hitSlop={8} className="items-center">
          <Text variant="caption" className="underline">
            Skip for now
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const nextPickedAfterToggle = (current: Style[], style: Style): Style[] => {
  if (current.includes(style)) return current.filter((value) => value !== style);
  if (current.length >= MAX_PREFERRED_STYLES) return current;
  return [...current, style];
};

const pickedSummary = (picked: Style[]): string => {
  if (picked.length === 0) return "Skip to use a balanced default mix.";
  if (picked.length === 1) return `1 of ${MAX_PREFERRED_STYLES} picked.`;
  return `${picked.length} of ${MAX_PREFERRED_STYLES} picked.`;
};
