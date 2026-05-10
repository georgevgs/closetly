import { createContext, useContext, useEffect, useState } from "react";

import { onboardingKeys, readFlag, writeFlag } from "./storage";

type OnboardingState = {
  loading: boolean;
  hasSeenWelcome: boolean;
  markSeen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState>({
  loading: true,
  hasSeenWelcome: false,
  markSeen: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    let active = true;
    readFlag(onboardingKeys.welcomeSeen).then((seen) => {
      if (!active) return;
      setHasSeenWelcome(seen);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const markSeen = async () => {
    await writeFlag(onboardingKeys.welcomeSeen, true);
    setHasSeenWelcome(true);
  };

  return (
    <OnboardingContext.Provider value={{ loading, hasSeenWelcome, markSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
