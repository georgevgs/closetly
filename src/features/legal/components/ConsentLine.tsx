import { useRouter } from "expo-router";

import { Text } from "~/components/ui/Text";

export function ConsentLine() {
  const router = useRouter();

  const openPrivacy = () => router.push("/legal/privacy");
  const openTerms = () => router.push("/legal/terms");

  return (
    <Text variant="caption" className="text-center">
      By continuing you agree to our{" "}
      <Text
        variant="caption"
        className="underline text-ink dark:text-ink-dark"
        onPress={openPrivacy}
      >
        Privacy Policy
      </Text>
      {" "}and{" "}
      <Text
        variant="caption"
        className="underline text-ink dark:text-ink-dark"
        onPress={openTerms}
      >
        Terms of Service
      </Text>
      .
    </Text>
  );
}
