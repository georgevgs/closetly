import { router, type Href } from "expo-router";

import { Screen } from "~/components/ui/Screen";
import { WelcomeContent } from "~/features/onboarding/components/WelcomeContent";

// The expo-router typed-routes generator hasn't seen `vibes.tsx` until the
// next `expo start`; we cast through Href so this file compiles in the
// meantime. The route itself is valid — Stack auto-discovers it.
const VIBES_ROUTE = "/onboarding/vibes" as Href;

export default function WelcomeScreen() {
  // The vibes screen is the actual onboarding endpoint — it stores the
  // user's preferences (or skips them) and marks the welcome flow complete.
  // Keeping markSeen there lets the user back out of vibes without ending
  // up in a "welcomed but never set up" limbo.
  const handleGetStarted = () => {
    router.push(VIBES_ROUTE);
  };

  return (
    <Screen>
      <WelcomeContent onGetStarted={handleGetStarted} />
    </Screen>
  );
}
