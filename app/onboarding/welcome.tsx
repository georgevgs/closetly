import { router } from "expo-router";

import { Screen } from "~/components/ui/Screen";
import { WelcomeContent } from "~/features/onboarding/components/WelcomeContent";
import { useOnboarding } from "~/features/onboarding/context";

export default function WelcomeScreen() {
  const { markSeen } = useOnboarding();

  const handleGetStarted = async () => {
    await markSeen();
    router.replace("/(app)");
  };

  return (
    <Screen>
      <WelcomeContent onGetStarted={handleGetStarted} />
    </Screen>
  );
}
