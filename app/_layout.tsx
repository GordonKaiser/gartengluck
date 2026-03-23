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
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

const BESTELLHISTORIE_KEY = "gartengluck_bestellhistorie";
const APP_PIN_KEY = "gartengluck_app_pin";

/** Aktualisiert den Status einer Bestellung in der lokalen Historie */
async function aktualisiereBestellStatus(bestellId: number, neuerStatus: string, abholdatum?: string) {
  try {
    const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
    if (!raw) return;
    const historie = JSON.parse(raw);
    let geaendert = false;
    for (const eintrag of historie) {
      if (eintrag.id === bestellId) {
        eintrag.status = neuerStatus;
        if (abholdatum) eintrag.abholdatum = abholdatum;
        geaendert = true;
      }
    }
    if (geaendert) {
      await AsyncStorage.setItem(BESTELLHISTORIE_KEY, JSON.stringify(historie));
    }
  } catch {
    // Ignorieren
  }
}

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

  // PIN-Abfrage beim App-Start
  const [pinGeprueft, setPinGeprueft] = useState(false);
  const [pinAbfrageOffen, setPinAbfrageOffen] = useState(false);
  const [pinEingabe, setPinEingabe] = useState("");
  const [pinFehler, setPinFehler] = useState(false);
  const [pinVergessen, setPinVergessen] = useState(false);
  const [pinVergessenTelefon, setPinVergessenTelefon] = useState("");
  const [pinVergessenFehler, setPinVergessenFehler] = useState("");

  // Bewertungs-Dialog nach Abholung
  const [bewertungDialog, setBewertungDialog] = useState<{
    bestellId: number;
    hofName: string;
    userId: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const gespeicherterPin = await AsyncStorage.getItem(APP_PIN_KEY);
      if (gespeicherterPin) {
        setPinAbfrageOffen(true);
      } else {
        setPinGeprueft(true);
      }
    })();
  }, []);

  const handlePinPruefen = useCallback(async () => {
    const gespeicherterPin = await AsyncStorage.getItem(APP_PIN_KEY);
    if (pinEingabe === gespeicherterPin) {
      setPinAbfrageOffen(false);
      setPinGeprueft(true);
      setPinFehler(false);
    } else {
      setPinFehler(true);
      setPinEingabe("");
    }
  }, [pinEingabe]);

  const handlePinZuruecksetzen = useCallback(async () => {
    try {
      const { ladeNutzerProfil } = await import("@/lib/nutzer-store");
      const profil = await ladeNutzerProfil();
      if (!profil?.telefon) {
        setPinVergessenFehler("Kein Nutzerprofil gefunden.");
        return;
      }
      const eingabe = pinVergessenTelefon.replace(/\s/g, "");
      const gespeichert = profil.telefon.replace(/\s/g, "");
      if (eingabe !== gespeichert) {
        setPinVergessenFehler("Telefonnummer stimmt nicht überein.");
        return;
      }
      await AsyncStorage.removeItem(APP_PIN_KEY);
      setPinAbfrageOffen(false);
      setPinGeprueft(true);
      setPinVergessen(false);
      setPinVergessenTelefon("");
      setPinVergessenFehler("");
    } catch {
      setPinVergessenFehler("Fehler beim Zurücksetzen. Bitte erneut versuchen.");
    }
  }, [pinVergessenTelefon]);

  // Onboarding-Check: Beim ersten Start auf Onboarding-Screen weiterleiten
  useEffect(() => {
    if (!pinGeprueft) return;
    import("@/lib/nutzer-store").then(({ ladeNutzerProfil }) => {
      ladeNutzerProfil().then((profil) => {
        if (!profil) {
          router.replace("/onboarding");
        }
      });
    });
  }, [pinGeprueft]);

  // Push-Token registrieren und im Backend speichern
  useEffect(() => {
    if (Platform.OS === "web") return;
    (async () => {
      try {
        // Android-Kanal einrichten
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("gartengluck", {
            name: "LocaBuy Bestellungen",
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
        // Push-Token lokal speichern (wird bei jeder Bestellung mitgesendet)
        const { ladeNutzerProfil, speicherePushToken } = await import("@/lib/nutzer-store");
        await speicherePushToken(pushToken);
        // Push-Token mit Telefonnummer verknüpfen (HofSpot v2.0 API – Fallback)
        const profil = await ladeNutzerProfil();
        if (!profil?.telefon) return;
        // Wenn Nutzer Push-Benachrichtigungen deaktiviert hat, Token nicht senden
        if (profil.pushBenachrichtigungen === false) return;
        const { registrierePushToken } = await import("@/lib/hofmarkt-api");
        await registrierePushToken(profil.telefon, pushToken).catch(() => {
          // Ignorieren – Endpunkt noch nicht auf HofSpot implementiert
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
    // Benachrichtigung im Vordergrund empfangen → Status lokal aktualisieren + Bewertungs-Dialog
    const foregroundSub = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data;
      if (data?.bestellId && data?.neuerStatus) {
        const abholdatum = data?.abholdatum ? String(data.abholdatum) : undefined;
        await aktualisiereBestellStatus(Number(data.bestellId), String(data.neuerStatus), abholdatum);
        // Bei Abholung: Bewertungs-Dialog anzeigen
        if (String(data.neuerStatus) === "abgeholt" && data.hofName && data.hofUserId) {
          setBewertungDialog({
            bestellId: Number(data.bestellId),
            hofName: String(data.hofName),
            userId: Number(data.hofUserId),
          });
        }
      }
    });
    // Tap auf Benachrichtigung → Status aktualisieren + Bewertungs-Dialog oder Navigation
    const tapSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data;
      if (data?.bestellId && data?.neuerStatus) {
        const abholdatum = data?.abholdatum ? String(data.abholdatum) : undefined;
        await aktualisiereBestellStatus(Number(data.bestellId), String(data.neuerStatus), abholdatum);
        // Bei Abholung: Bewertungs-Dialog anzeigen
        if (String(data.neuerStatus) === "abgeholt" && data.hofName && data.hofUserId) {
          setBewertungDialog({
            bestellId: Number(data.bestellId),
            hofName: String(data.hofName),
            userId: Number(data.hofUserId),
          });
          return;
        }
      }
      const url = data?.url;
      if (typeof url === "string") {
        router.push(url as never);
      } else {
        router.push("/(tabs)/bestellungen" as never);
      }
    });
    return () => { foregroundSub.remove(); tapSub.remove(); };
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

  // Bewertungs-Dialog-Modal (erscheint nach "abgeholt"-Push)
  const bewertungModal = bewertungDialog ? (
    <BewertungsDialogModal
      hofName={bewertungDialog.hofName}
      userId={bewertungDialog.userId}
      bestellId={bewertungDialog.bestellId}
      onClose={() => setBewertungDialog(null)}
      onBewerten={() => {
        const { bestellId, hofName, userId } = bewertungDialog;
        setBewertungDialog(null);
        router.push({
          pathname: "/bewertung" as any,
          params: {
            bestellIndex: String(bestellId),
            hofName,
            userId: String(userId),
          },
        });
      }}
    />
  ) : null;

  const pinModal = pinAbfrageOffen ? (
    <Modal visible transparent animationType="fade">
      <View style={pinStyles.overlay}>
        <View style={pinStyles.box}>
          {!pinVergessen ? (
            <>
              <Text style={pinStyles.titel}>🔒 App gesperrt</Text>
              <Text style={pinStyles.hinweis}>Bitte gib deinen PIN ein, um fortzufahren.</Text>
              <TextInput
                style={[pinStyles.input, pinFehler && pinStyles.inputFehler]}
                value={pinEingabe}
                onChangeText={(t) => { setPinEingabe(t.replace(/\D/g, "")); setPinFehler(false); }}
                placeholder="PIN eingeben"
                placeholderTextColor="#999"
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={handlePinPruefen}
                autoFocus
              />
              {pinFehler && <Text style={pinStyles.fehler}>Falscher PIN. Bitte erneut versuchen.</Text>}
              <Pressable
                style={({ pressed }) => [pinStyles.button, pressed && { opacity: 0.85 }]}
                onPress={handlePinPruefen}
              >
                <Text style={pinStyles.buttonText}>Entsperren</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [pinStyles.vergessen, pressed && { opacity: 0.6 }]}
                onPress={() => { setPinVergessen(true); setPinFehler(false); setPinEingabe(""); }}
              >
                <Text style={pinStyles.vergessenText}>PIN vergessen?</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={pinStyles.titel}>🔓 PIN zurücksetzen</Text>
              <Text style={pinStyles.hinweis}>
                Gib deine registrierte Telefonnummer ein, um den PIN zu entfernen.
              </Text>
              <TextInput
                style={[pinStyles.input, { letterSpacing: 1, fontSize: 16 }, pinVergessenFehler ? pinStyles.inputFehler : null]}
                value={pinVergessenTelefon}
                onChangeText={(t) => { setPinVergessenTelefon(t); setPinVergessenFehler(""); }}
                placeholder="+49 151 12345678"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handlePinZuruecksetzen}
                autoFocus
              />
              {pinVergessenFehler ? <Text style={pinStyles.fehler}>{pinVergessenFehler}</Text> : null}
              <Pressable
                style={({ pressed }) => [pinStyles.button, pressed && { opacity: 0.85 }]}
                onPress={handlePinZuruecksetzen}
              >
                <Text style={pinStyles.buttonText}>PIN entfernen</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [pinStyles.vergessen, pressed && { opacity: 0.6 }]}
                onPress={() => { setPinVergessen(false); setPinVergessenFehler(""); setPinVergessenTelefon(""); }}
              >
                <Text style={pinStyles.vergessenText}>← Zurück</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  ) : null;

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
            <Stack.Screen name="bewertung" options={{ presentation: "modal" }} />
            <Stack.Screen name="profil-bearbeiten" options={{ presentation: "modal" }} />
            <Stack.Screen name="karte" options={{ presentation: "modal" }} />
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
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {content}
        {pinModal}
      {bewertungModal}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

// ── Bewertungs-Dialog-Komponente ─────────────────────────────────────────────

function BewertungsDialogModal({
  hofName,
  onClose,
  onBewerten,
}: {
  hofName: string;
  userId: number;
  bestellId: number;
  onClose: () => void;
  onBewerten: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={bewertungStyles.overlay}>
        <View style={bewertungStyles.box}>
          <Text style={bewertungStyles.emoji}>🎉</Text>
          <Text style={bewertungStyles.titel}>Bestellung abgeholt!</Text>
          <Text style={bewertungStyles.hinweis}>
            Wie war deine Bestellung bei{"\n"}
            <Text style={{ fontWeight: "700" }}>{hofName}</Text>?
          </Text>
          <Pressable
            style={({ pressed }) => [bewertungStyles.button, pressed && { opacity: 0.85 }]}
            onPress={onBewerten}
          >
            <Text style={bewertungStyles.buttonText}>⭐ Jetzt bewerten</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [bewertungStyles.spaeter, pressed && { opacity: 0.6 }]}
            onPress={onClose}
          >
            <Text style={bewertungStyles.spaeterText}>Später</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const bewertungStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  titel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 8,
    textAlign: "center",
  },
  hinweis: {
    fontSize: 15,
    color: "#687076",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#4a7c59",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  spaeter: { alignItems: "center", paddingVertical: 8 },
  spaeterText: { fontSize: 14, color: "#687076" },
});

const pinStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 360,
  },
  titel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 8,
    textAlign: "center",
  },
  hinweis: {
    fontSize: 14,
    color: "#687076",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: "#11181C",
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 8,
  },
  inputFehler: { borderColor: "#EF4444" },
  fehler: { fontSize: 13, color: "#EF4444", textAlign: "center", marginBottom: 8 },
  button: {
    backgroundColor: "#4a7c59",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  vergessen: { alignItems: "center", marginTop: 16 },
  vergessenText: { fontSize: 14, color: "#4a7c59" },
});
