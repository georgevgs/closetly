import { useState } from "react";
import { Pressable, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Text } from "~/components/ui/Text";
import { useLocationPermission } from "~/features/weather/hooks/useLocationPermission";
import { weatherKeys } from "~/features/weather/useWeather";

export function LocationPrompt() {
  const { status, request } = useLocationPermission();
  const [dismissedThisSession, setDismissedThisSession] = useState(false);
  const queryClient = useQueryClient();

  if (status !== "undetermined") return null;
  if (dismissedThisSession) return null;

  const handleEnable = async () => {
    const next = await request();
    if (next === "granted") {
      queryClient.invalidateQueries({ queryKey: weatherKeys.current });
    }
  };

  const handleDismiss = () => setDismissedThisSession(true);

  return (
    <View className="mx-6 mt-4 rounded-xl border border-line dark:border-line-dark p-4">
      <Text variant="headline">Match outfits to today&apos;s weather</Text>
      <Text variant="caption" className="mt-1 leading-5">
        Closetly checks the local forecast so it can suggest warmer or lighter
        layers. Your location stays on your device.
      </Text>
      <View className="flex-row gap-3 mt-4">
        <Pressable
          onPress={handleEnable}
          className="flex-1 h-10 rounded-lg bg-ink dark:bg-ink-dark items-center justify-center active:opacity-80"
        >
          <Text className="text-canvas dark:text-canvas-dark font-medium">
            Enable
          </Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          className="flex-1 h-10 rounded-lg border border-line dark:border-line-dark items-center justify-center active:opacity-60"
        >
          <Text variant="body">Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}
