import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

export type BgRemoveMaskStats = {
  coverage: number;
  aspect: number;
  bboxW: number;
  bboxH: number;
  sampleW: number;
  sampleH: number;
};

export type BgRemoveResult = {
  uri: string;
  width: number;
  height: number;
  mask?: BgRemoveMaskStats;
  colors?: string[];
};

type NativeModule = {
  isAvailable(): boolean;
  removeBackground(uri: string): Promise<BgRemoveResult>;
};

const native = requireOptionalNativeModule<NativeModule>("ExpoBgRemover");

export function isBgRemovalAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  if (!native) return false;
  return native.isAvailable();
}

export async function removeBackground(uri: string): Promise<BgRemoveResult> {
  if (!native) {
    throw new Error("expo-bg-remover native module not available");
  }
  return native.removeBackground(uri);
}
