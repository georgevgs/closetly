import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";

import { Text } from "~/components/ui/Text";

export function LegalLinks() {
  const router = useRouter();

  const openPrivacy = () => router.push("/legal/privacy");
  const openTerms = () => router.push("/legal/terms");

  return (
    <View>
      <Text variant="label">Legal</Text>
      <View className="mt-2 rounded-lg border border-line dark:border-line-dark overflow-hidden">
        <LegalRow label="Privacy Policy" onPress={openPrivacy} />
        <Divider />
        <LegalRow label="Terms of Service" onPress={openTerms} />
      </View>
    </View>
  );
}

function LegalRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 h-12 active:opacity-60"
    >
      <Text variant="body">{label}</Text>
      <SymbolView name="chevron.right" size={14} tintColor="#a8a29e" />
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-line dark:bg-line-dark" />;
}
