import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { useEffect } from "react";
import { useColorScheme } from "nativewind";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Toaster } from "sonner-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryProvider } from "~/providers/QueryProvider";
import { ThemeProvider } from "~/providers/ThemeProvider";
import { CategoryPrefsProvider } from "~/providers/CategoryPrefsProvider";
import { AuthProvider, useAuth } from "~/features/auth/context";
import { OnboardingProvider, useOnboarding } from "~/features/onboarding/context";

export const unstable_settings = {
  initialRouteName: "(app)",
};

function AuthGate() {
  const { session, loading } = useAuth();
  const { hasSeenWelcome, loading: welcomeLoading } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || welcomeLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "onboarding";

    if (!session) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in");
      return;
    }

    if (!hasSeenWelcome) {
      if (!inOnboardingGroup) router.replace("/onboarding/welcome");
      return;
    }

    if (inAuthGroup || inOnboardingGroup) {
      router.replace("/(app)");
    }
  }, [session, loading, hasSeenWelcome, welcomeLoading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="items/new"
        options={{ presentation: "modal", headerShown: true, title: "New item" }}
      />
      <Stack.Screen
        name="items/[id]"
        options={{ headerShown: true, headerBackTitle: "Closet", title: "Item" }}
      />
      <Stack.Screen
        name="items/edit/[id]"
        options={{ presentation: "modal", headerShown: true, title: "Edit item" }}
      />
      <Stack.Screen
        name="outfits/suggest"
        options={{ presentation: "modal", headerShown: true, title: "Outfit ideas" }}
      />
      <Stack.Screen
        name="outfits/build"
        options={{ presentation: "modal", headerShown: true, title: "Build outfit" }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ presentation: "modal", headerShown: true, title: "Privacy Policy" }}
      />
      <Stack.Screen
        name="legal/terms"
        options={{ presentation: "modal", headerShown: true, title: "Terms of Service" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <CategoryPrefsProvider>
            <QueryProvider>
              <AuthProvider>
                <OnboardingProvider>
                  <BottomSheetModalProvider>
                    <AuthGate />
                    <Toaster theme={colorScheme === "dark" ? "dark" : "light"} position="top-center" />
                    <StatusBar style="auto" />
                  </BottomSheetModalProvider>
                </OnboardingProvider>
              </AuthProvider>
            </QueryProvider>
          </CategoryPrefsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
