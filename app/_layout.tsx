import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Toaster } from "sonner-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryProvider } from "~/providers/QueryProvider";
import { AuthProvider, useAuth } from "~/features/auth/context";

export const unstable_settings = {
  initialRouteName: "(app)",
};

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [session, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen
        name="items/new"
        options={{ presentation: "modal", headerShown: true, title: "New item" }}
      />
      <Stack.Screen
        name="items/[id]"
        options={{ headerShown: true, headerBackTitle: "Closet" }}
      />
      <Stack.Screen
        name="outfits/suggest"
        options={{ presentation: "modal", headerShown: true, title: "Outfit ideas" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <BottomSheetModalProvider>
              <AuthGate />
              <Toaster theme={scheme === "dark" ? "dark" : "light"} position="top-center" />
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
