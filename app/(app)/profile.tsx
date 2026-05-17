import { useState } from "react";
import { Alert, ScrollView, View, Pressable } from "react-native";
import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { Pill } from "~/components/ui/Pill";
import { useAuth } from "~/features/auth/context";
import { supabase } from "~/lib/supabase";
import { useThemePreference, type ThemePreference } from "~/providers/ThemeProvider";
import { useCategoryPrefs } from "~/providers/CategoryPrefsProvider";
import { WearHistorySection } from "~/features/wear/components/WearHistorySection";
import { WardrobeStatsSection } from "~/features/wear/components/WardrobeStatsSection";
import { LegalLinks } from "~/features/legal/components/LegalLinks";
import { useSuggestionInteractions } from "~/features/outfits/suggestionInteractions";
import {
  usePreferredStyles,
  togglePreferredStyle,
  MAX_PREFERRED_STYLES,
} from "~/features/profile/stylePreferences";
import { CATEGORIES, STYLES, type Style } from "~/types/items";
import { cn } from "~/lib/utils";
import { handleError } from "~/lib/handleError";

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  bag: "Bags",
  hat: "Hats",
  accessory: "Accessories",
};

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function ProfileScreen() {
  const { session } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const { isHidden, toggle, visible } = useCategoryPrefs();
  const preferredStyles = usePreferredStyles();
  const [signingOut, setSigningOut] = useState(false);

  const handleStyleToggle = (style: Style) => {
    togglePreferredStyle(style);
  };

  const resetSuggestionInteractions = useSuggestionInteractions(
    (state) => state.reset,
  );

  const performSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      handleError(error, { fallbackMessage: "Couldn't sign out." });
      return;
    }
    resetSuggestionInteractions();
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "You'll need your email to sign back in.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: performSignOut },
    ]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}>
        <View className="pt-6">
          <Text variant="display">Profile</Text>
        </View>
        <View className="mt-12 gap-8">
          <View>
            <Text variant="label">Email</Text>
            <Text variant="body" className="mt-1">
              {displayEmail(session)}
            </Text>
          </View>

          <View>
            <Text variant="label">Appearance</Text>
            <View className="mt-2 flex-row rounded-full border border-line dark:border-line-dark p-1">
              {THEME_OPTIONS.map((option) => {
                const selected = preference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPreference(option.value)}
                    className={cn(
                      "flex-1 h-9 rounded-full items-center justify-center",
                      selected && "bg-ink dark:bg-ink-dark",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm",
                        selected && "text-canvas dark:text-canvas-dark font-medium",
                        !selected && "text-ink dark:text-ink-dark",
                      )}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text variant="label">Style</Text>
            <Text variant="caption" className="mt-1 mb-3">
              {stylesCaption(preferredStyles.length)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {STYLES.map((style) => (
                <Pill
                  key={style}
                  label={style}
                  selected={preferredStyles.includes(style)}
                  onPress={() => handleStyleToggle(style)}
                />
              ))}
            </View>
          </View>

          <View>
            <Text variant="label">Categories</Text>
            <Text variant="caption" className="mt-1 mb-3">
              {categoriesCaption(visible.length)}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Pill
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  selected={!isHidden(category)}
                  onPress={() => toggle(category)}
                />
              ))}
            </View>
          </View>

          <WardrobeStatsSection userId={session?.user.id} />

          <WearHistorySection userId={session?.user.id} />

          <LegalLinks />
        </View>
        <View className="mt-auto pt-12">
          <Button
            label="Sign out"
            variant="secondary"
            onPress={confirmSignOut}
            loading={signingOut}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const displayEmail = (
  session: { user?: { email?: string | null } } | null | undefined,
): string => {
  const email = session?.user?.email;
  if (email) return email;
  return "—";
};

const categoriesCaption = (visibleCount: number): string => {
  const total = CATEGORIES.length;
  if (visibleCount === total) return `Showing all ${total} — tap to hide ones you don't wear`;
  return `Showing ${visibleCount} of ${total} — tap a hidden category to bring it back`;
};

const stylesCaption = (pickedCount: number): string => {
  if (pickedCount === 0) {
    return `Pick up to ${MAX_PREFERRED_STYLES} aesthetics — outfit suggestions will lean into them.`;
  }
  return `${pickedCount} of ${MAX_PREFERRED_STYLES} picked — tap to add or remove.`;
};
