import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNwColorScheme } from "nativewind";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "closetly:theme";

type ThemeCtx = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNwColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === "light" || raw === "dark" || raw === "system") {
        setPreferenceState(raw);
        setColorScheme(raw);
      }
    });
  }, [setColorScheme]);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    setColorScheme(p);
    AsyncStorage.setItem(STORAGE_KEY, p);
  };

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePreference must be used inside ThemeProvider");
  return ctx;
}
