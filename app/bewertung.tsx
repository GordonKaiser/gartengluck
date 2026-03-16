/**
 * LocaBuy – Bewertungs-Screen
 * Nutzer kann nach einer abgeholten Bestellung eine Sterne-Bewertung
 * und einen optionalen Kommentar für den Hof abgeben.
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { sendeHofBewertung } from "@/lib/hofmarkt-api";
import { markiereBewertungAbgegeben } from "@/lib/nutzer-store";

export default function BewertungScreen() {
  const colors = useColors();
  const { bestellIndex, hofName, userId } = useLocalSearchParams<{
    bestellIndex: string;
    hofName: string;
    userId: string;
  }>();

  const [sterne, setSterne] = useState(0);
  const [kommentar, setKommentar] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSternTap = (wert: number) => {
    setSterne(wert);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAbsenden = async () => {
    if (sterne === 0) {
      Alert.alert("Bitte Sterne wählen", "Wähle mindestens 1 Stern aus.");
      return;
    }

    setIsLoading(true);
    try {
      await sendeHofBewertung({
        userId: Number(userId),
        sterne: sterne as 1 | 2 | 3 | 4 | 5,
        kommentar: kommentar.trim() || undefined,
      });

      // Bewertung lokal als abgegeben markieren
      await markiereBewertungAbgegeben(Number(bestellIndex));

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        "Danke für deine Bewertung!",
        `Deine ${sterne}-Sterne-Bewertung für ${hofName} wurde gespeichert.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        "Fehler",
        err.message ?? "Bewertung konnte nicht gespeichert werden. Bitte versuche es später erneut."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const s = styles(colors);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={s.header}>
            <Pressable
              style={({ pressed }) => [s.zurueckButton, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
            >
              <Text style={s.zurueckText}>← Zurück</Text>
            </Pressable>
            <Text style={s.titel}>Bewertung abgeben</Text>
            <Text style={s.untertitel}>{hofName}</Text>
          </View>

          {/* Sterne-Auswahl */}
          <View style={s.sterneContainer}>
            <Text style={s.sterneTitel}>Wie war deine Erfahrung?</Text>
            <View style={s.sterneReihe}>
              {[1, 2, 3, 4, 5].map((wert) => (
                <Pressable
                  key={wert}
                  onPress={() => handleSternTap(wert)}
                  style={({ pressed }) => [
                    s.sternButton,
                    pressed && { transform: [{ scale: 1.2 }] },
                  ]}
                >
                  <Text style={[s.stern, wert <= sterne && s.sternAktiv]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
            {sterne > 0 && (
              <Text style={s.sterneLabel}>
                {["", "Schlecht", "Nicht so gut", "Ok", "Gut", "Ausgezeichnet"][sterne]}
              </Text>
            )}
          </View>

          {/* Kommentar */}
          <View style={s.kommentarContainer}>
            <Text style={s.kommentarLabel}>Kommentar (optional)</Text>
            <TextInput
              style={s.kommentarInput}
              value={kommentar}
              onChangeText={setKommentar}
              placeholder="Erzähl anderen von deiner Erfahrung..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={s.zeichenZaehler}>{kommentar.length}/500</Text>
          </View>

          {/* Absenden-Button */}
          <Pressable
            style={({ pressed }) => [
              s.absendenButton,
              pressed && { opacity: 0.85 },
              (sterne === 0 || isLoading) && s.absendenButtonDisabled,
            ]}
            onPress={handleAbsenden}
            disabled={sterne === 0 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.absendenText}>Bewertung absenden</Text>
            )}
          </Pressable>

          <Text style={s.hinweis}>
            Bewertungen müssen wahrheitsgemäß und sachlich sein.
            Beleidigende oder unwahre Bewertungen werden entfernt.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 1,
      padding: 20,
      paddingBottom: 48,
    },
    header: {
      marginBottom: 32,
    },
    zurueckButton: {
      alignSelf: "flex-start",
      marginBottom: 16,
      paddingVertical: 4,
    },
    zurueckText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: "500",
    },
    titel: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    untertitel: {
      fontSize: 16,
      color: colors.muted,
    },
    sterneContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      alignItems: "center",
      marginBottom: 20,
    },
    sterneTitel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 20,
    },
    sterneReihe: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    sternButton: {
      padding: 4,
    },
    stern: {
      fontSize: 44,
      color: colors.border,
    },
    sternAktiv: {
      color: "#F59E0B",
    },
    sterneLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      marginTop: 4,
    },
    kommentarContainer: {
      marginBottom: 24,
    },
    kommentarLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 8,
    },
    kommentarInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      fontSize: 15,
      color: colors.foreground,
      minHeight: 120,
      lineHeight: 22,
    },
    zeichenZaehler: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "right",
      marginTop: 4,
    },
    absendenButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginBottom: 16,
    },
    absendenButtonDisabled: {
      opacity: 0.45,
    },
    absendenText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
    hinweis: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 18,
    },
  });
