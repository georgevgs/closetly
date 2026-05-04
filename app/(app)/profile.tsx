import { View, Pressable } from "react-native";
import { Screen } from "~/components/ui/Screen";
import { Text } from "~/components/ui/Text";
import { Button } from "~/components/ui/Button";
import { useAuth } from "~/features/auth/context";
import { supabase } from "~/lib/supabase";

export default function ProfileScreen() {
  const { session } = useAuth();
  return (
    <Screen className="px-6">
      <View className="pt-6">
        <Text variant="display">Profile</Text>
      </View>
      <View className="mt-12 gap-4">
        <View>
          <Text variant="label">Email</Text>
          <Text variant="body">{session?.user.email ?? "—"}</Text>
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
