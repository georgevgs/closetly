import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") focusManager.setFocused(status === "active");
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const subscribed = useRef(false);
  useEffect(() => {
    if (subscribed.current) return;
    subscribed.current = true;
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, []);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export { queryClient };
