import * as ImagePicker from "expo-image-picker";

import type { Item } from "~/types/items";
import { signItemUrls } from "./mapper";

export const PICKER_OPTIONS: Parameters<typeof ImagePicker.launchCameraAsync>[0] = {
  mediaTypes: ["images"],
  quality: 0.9,
  allowsEditing: true,
  aspect: [1, 1],
};

export type PickerSource = "camera" | "library";

export const launchPicker = (source: PickerSource) => {
  if (source === "camera") return ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  return ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
};

// Returns the first signed item for screens that display only one piece. Wraps
// the array call in a single-item helper so callers don't have to thread
// nullability checks through query functions.
export const signFirst = async (
  item: Item | null | undefined,
): Promise<Item | null> => {
  if (!item) return null;
  const signed = await signItemUrls([item]);
  return signed[0];
};
