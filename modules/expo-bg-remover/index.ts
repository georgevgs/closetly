import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

type NativeModule = {
  isAvailable(): boolean;
  removeBackground(uri: string): Promise<{
    uri: string;
    width: number;
    height: number;
  }>;
};

const native = requireOptionalNativeModule<NativeModule>("ExpoBgRemover");

export function isBgRemovalAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (!native) return false;
  return native.isAvailable();
}

export async function removeBackground(uri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  if (!native) {
    throw new Error("expo-bg-remover native module not available");
  }
  return native.removeBackground(uri);
}
