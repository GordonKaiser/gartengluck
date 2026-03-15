import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { WarenkorbProvider } from "@/lib/warenkorb-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Onboarding-Check: Beim ersten Start auf Onboarding-Screen weiterleiten
  useEffect(() => {
    import("@/lib/nutzer-store").then(({ ladeNutzerProfil }) => {
      ladeNutzerProfil().then((profil) => {
        if (!profil) {
          router.replace("/onboarding");
        }
      });
    });
  }, []);

  // Push-Token registrieren und im Backend speichern
  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        // Android-Kanal einrichten
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("gartengluck", {
            name: "Gartenglück Bestellungen",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }
        // Nur auf echtem Gerät
        if (!Device.isDevice) return;
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;
        // Expo Push Token holen
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) return;
        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (!pushToken) return;
        // Im Backend speichern
        const { ladeNutzerProfil } = await import("@/lib/nutzer-store");
        const profil = await ladeNutzerProfil();
        if (!profil?.telefon) return;
        const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
        await fetch(`${apiBase}/api/trpc/nutzer.pushTokenSpeichern?batch=1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "0": { json: { telefon: profil.telefon, pushToken } } }),
        });
      } catch {
        // Ignorieren – Push-Token ist optional
      }
    })();
  }, []);

  // Notification-Handler: Benachrichtigungen auch im Vordergrund anzeigen
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    // Tap auf Benachrichtigung → Favoriten-Tab öffnen
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") {
        router.push(url as never);
      } else {
        router.push("/(tabs)/favoriten" as never);
      }
    });
    return () => sub.remove();
  }, []);

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WarenkorbProvider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="hof/[id]" />
            <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="bestellung" options={{ presentation: "modal" }} />
            <Stack.Screen name="oauth/callback" />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </trpc.Provider>
      </WarenkorbProvider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
