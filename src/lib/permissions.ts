import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";

export async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;

  if (current.canAskAgain) {
    const requested = await ImagePicker.requestCameraPermissionsAsync();
    if (requested.granted) return true;
    if (requested.canAskAgain) return false;
  }

  promptOpenSettings(
    "Camera permission needed",
    "Closetly needs camera access to capture items. Enable it from Settings.",
  );
  return false;
}

const promptOpenSettings = (title: string, message: string) => {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Open Settings", onPress: () => Linking.openSettings() },
  ]);
};
