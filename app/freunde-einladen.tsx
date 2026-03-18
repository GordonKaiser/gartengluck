/**
 * LocaBuy – Freunde einladen
 * Zeigt den persönlichen Referral-Code, Share-Sheet und Fortschrittsanzeige.
 * Belohnungen:
 *   - Stammkunde-Badge: ab 1 eingeladenen Freund
 *   - Wunschliste: ab 3 eingeladenen Freunden
 */

import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { ladeNutzerProfil } from "@/lib/nutzer-store";
import { useColors } from "@/hooks/use-colors";
import { useEffect } from "react";

const WUNSCHLISTE_SCHWELLE = 3;

export default function FreundeEinladenScreen() {
  const colors = useColors();
  const s = styles(colors);

  const [nutzerId, setNutzerId] = useState<number | null>(null);
  const [kopiert, setKopiert] = useState(false);

  useEffect(() => {
    ladeNutzerProfil().then((p) => {
      if (p?.id) setNutzerId(p.id);
    });
  }, []);

  const statusQuery = trpc.referral.meinStatus.useQuery(
    { nutzerId: nutzerId ?? 0 },
    { enabled: !!nutzerId }
  );

  const status = statusQuery.data;
  const anzahl = status?.anzahlEinladungen ?? 0;
  const code = status?.code ?? "…";
  const hatBadge = status?.hatStammkundeBadge ?? false;
  const hatWunschliste = status?.hatWunschliste ?? false;
  const fortschritt = Math.min(anzahl / WUNSCHLISTE_SCHWELLE, 1);

  const handleTeilen = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `Ich kaufe frische Produkte direkt vom Erzeuger mit LocaBuy! 🌿\nLade dir die App herunter und gib meinen Einladungscode ein: ${code}\nDann schalten wir gemeinsam die Wunschliste frei!`,
        title: "LocaBuy – Direkt vom Erzeuger",
      });
    } catch (_) {}
  };

  const handleKopieren = async () => {
    await Clipboard.setStringAsync(code);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setKopiert(true);
    setTimeout(() => setKopiert(false), 2000);
  };

  if (!nutzerId || statusQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={s.ladeContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Pressable
          style={({ pressed }) => [s.zurueck, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={s.zurueckText}>← Zurück</Text>
        </Pressable>

        <Text style={s.titel}>Freunde einladen</Text>
        <Text style={s.untertitel}>
          Teile deinen persönlichen Code und schalte Belohnungen frei.
        </Text>

        {/* Code-Box */}
        <View style={s.codeBox}>
          <Text style={s.codeLabel}>Dein Einladungscode</Text>
          <Text style={s.code}>{code}</Text>
          <View style={s.codeButtons}>
            <Pressable
              style={({ pressed }) => [s.codeButton, pressed && { opacity: 0.7 }]}
              onPress={handleKopieren}
            >
              <Text style={s.codeButtonText}>
                {kopiert ? "✓ Kopiert!" : "📋 Kopieren"}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.codeButtonPrimary, pressed && { opacity: 0.7 }]}
              onPress={handleTeilen}
            >
              <Text style={s.codeButtonPrimaryText}>🔗 Teilen</Text>
            </Pressable>
          </View>
        </View>

        {/* Fortschrittsanzeige */}
        <View style={s.fortschrittBox}>
          <View style={s.fortschrittHeader}>
            <Text style={s.fortschrittTitel}>
              {anzahl} von {WUNSCHLISTE_SCHWELLE} Freunden eingeladen
            </Text>
            {hatWunschliste && (
              <Text style={s.freigeschaltet}>✓ Freigeschaltet</Text>
            )}
          </View>
          <View style={s.fortschrittBalken}>
            <View style={[s.fortschrittFill, { width: `${fortschritt * 100}%` as any }]} />
          </View>
          <Text style={s.fortschrittHinweis}>
            {hatWunschliste
              ? "🎉 Du hast die Wunschliste freigeschaltet!"
              : `Noch ${WUNSCHLISTE_SCHWELLE - anzahl} Freund${WUNSCHLISTE_SCHWELLE - anzahl === 1 ? "" : "e"} bis zur Wunschliste`}
          </Text>
        </View>

        {/* Belohnungen */}
        <Text style={s.sektionTitel}>Deine Belohnungen</Text>

        <View style={[s.belohnungKarte, hatBadge && s.belohnungAktiv]}>
          <View style={s.belohnungIcon}>
            <Text style={s.belohnungEmoji}>🏅</Text>
          </View>
          <View style={s.belohnungInfo}>
            <Text style={s.belohnungName}>Stammkunde-Badge</Text>
            <Text style={s.belohnungBeschreibung}>
              Sichtbares „Gründungsmitglied"-Badge in deinem Profil.
            </Text>
            {hatBadge ? (
              <Text style={s.belohnungFreigeschaltet}>✓ Freigeschaltet</Text>
            ) : (
              <Text style={s.belohnungGesperrt}>Ab 1 eingeladenem Freund</Text>
            )}
          </View>
        </View>

        <View style={[s.belohnungKarte, hatWunschliste && s.belohnungAktiv]}>
          <View style={s.belohnungIcon}>
            <Text style={s.belohnungEmoji}>❤️</Text>
          </View>
          <View style={s.belohnungInfo}>
            <Text style={s.belohnungName}>Wunschliste</Text>
            <Text style={s.belohnungBeschreibung}>
              Merke dir Produkte und Höfe – bekomme eine Benachrichtigung wenn sie wieder verfügbar sind.
            </Text>
            {hatWunschliste ? (
              <Text style={s.belohnungFreigeschaltet}>✓ Freigeschaltet</Text>
            ) : (
              <Text style={s.belohnungGesperrt}>
                Ab {WUNSCHLISTE_SCHWELLE} eingeladenen Freunden
              </Text>
            )}
          </View>
        </View>

        {/* Wie funktioniert es? */}
        <View style={s.erklaerungBox}>
          <Text style={s.erklaerungTitel}>Wie funktioniert es?</Text>
          <Text style={s.erklaerungText}>
            1. Teile deinen Code mit Freunden{"\n"}
            2. Dein Freund gibt den Code bei der Registrierung ein{"\n"}
            3. Du erhältst automatisch eine Einladung gutgeschrieben{"\n"}
            4. Bei 1 Freund: Stammkunde-Badge{"\n"}
            5. Bei 3 Freunden: Wunschliste freigeschaltet
          </Text>
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 40 },
    ladeContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    zurueck: { marginBottom: 8 },
    zurueckText: { color: colors.primary, fontSize: 16 },
    titel: { fontSize: 26, fontWeight: "700", color: colors.foreground, marginBottom: 6 },
    untertitel: { fontSize: 15, color: colors.muted, marginBottom: 24, lineHeight: 22 },

    codeBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codeLabel: { fontSize: 13, color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
    code: { fontSize: 32, fontWeight: "800", color: colors.primary, letterSpacing: 4, marginBottom: 16 },
    codeButtons: { flexDirection: "row", gap: 10 },
    codeButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    codeButtonText: { color: colors.foreground, fontSize: 14, fontWeight: "600" },
    codeButtonPrimary: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    codeButtonPrimaryText: { color: "#fff", fontSize: 14, fontWeight: "600" },

    fortschrittBox: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fortschrittHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    fortschrittTitel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
    freigeschaltet: { fontSize: 13, color: colors.success, fontWeight: "600" },
    fortschrittBalken: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    fortschrittFill: {
      height: 8,
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    fortschrittHinweis: { fontSize: 13, color: colors.muted },

    sektionTitel: { fontSize: 17, fontWeight: "700", color: colors.foreground, marginBottom: 12 },

    belohnungKarte: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    belohnungAktiv: {
      borderColor: colors.success,
      backgroundColor: colors.surface,
    },
    belohnungIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    belohnungEmoji: { fontSize: 24 },
    belohnungInfo: { flex: 1 },
    belohnungName: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
    belohnungBeschreibung: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 6 },
    belohnungFreigeschaltet: { fontSize: 13, color: colors.success, fontWeight: "600" },
    belohnungGesperrt: { fontSize: 13, color: colors.muted },

    erklaerungBox: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    erklaerungTitel: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
    erklaerungText: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  });
