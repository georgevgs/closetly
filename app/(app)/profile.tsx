import { View, Pressable } from "react-native";
import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { useAuth } from "~/features/auth/context";
import { supabase } from "~/lib/supabase";
import { useThemePreference, type ThemePreference } from "~/providers/ThemeProvider";
import { cn } from "~/lib/utils";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function ProfileScreen() {
  const { session } = useAuth();
  const { preference, setPreference } = useThemePreference();

  return (
    <Screen className="px-6">
      <View className="pt-6">
        <Text variant="display">Profile</Text>
      </View>
      <View className="mt-12 gap-8">
        <View>
          <Text variant="label">Email</Text>
          <Text variant="body" className="mt-1">
            {session?.user.email ?? "—"}
          </Text>
        </View>

        <View>
          <Text variant="label">Appearance</Text>
          <View className="mt-2 flex-row rounded-full border border-line dark:border-line-dark p-1">
            {THEME_OPTIONS.map((opt) => {
              const selected = preference === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  className={cn(
                    "flex-1 h-9 rounded-full items-center justify-center",
                    selected && "bg-ink dark:bg-ink-dark",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      selected
                        ? "text-canvas dark:text-canvas-dark font-medium"
                        : "text-ink dark:text-ink-dark",
                    )}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <View className="mt-auto mb-8">
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => supabase.auth.signOut()}
        />
      </View>
    </Screen>
  );
}
