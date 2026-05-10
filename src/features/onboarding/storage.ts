import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_PREFIX = "closetly:onboarding";

export const onboardingKeys = {
  welcomeSeen: `${STORAGE_PREFIX}:welcomeSeen`,
} as const;

export async function readFlag(key: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(key);
  return value === "1";
}

export async function writeFlag(key: string, value: boolean): Promise<void> {
  if (value) {
    await AsyncStorage.setItem(key, "1");
    return;
  }
  await AsyncStorage.removeItem(key);
}
