/**
 * LocaBuy – Wunschliste
 * Zeigt gemerkte Höfe und Produkte.
 * Nur zugänglich wenn hatWunschliste === true (ab 3 eingeladenen Freunden).
 */

import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { ladeNutzerProfil } from "@/lib/nutzer-store";
import {
  ladeWunschliste,
  vonWunschlisteEntfernen,
  type WunschlistenEintrag,
} from "@/lib/wunschliste-store";

export default function WunschlisteScreen() {
  const colors = useColors();
  const s = styles(colors);

  const [nutzerId, setNutzerId] = useState<number | null>(null);
  const [eintraege, setEintraege] = useState<WunschlistenEintrag[]>([]);
  const [laedt, setLaedt] = useState(true);
  const [freigeschaltet, setFreigeschaltet] = useState<boolean | null>(null);

  const statusQuery = trpc.referral.meinStatus.useQuery(
    { nutzerId: nutzerId ?? 0 },
    { enabled: !!nutzerId }
  );

  useEffect(() => {
    ladeNutzerProfil().then((p) => {
      if (p?.id) setNutzerId(p.id);
    });
  }, []);

  useEffect(() => {
    if (statusQuery.data !== undefined) {
      setFreigeschaltet(statusQuery.data.hatWunschliste);
    }
  }, [statusQuery.data]);

  const ladeEintraege = useCallback(async () => {
    setLaedt(true);
    const liste = await ladeWunschliste();
    setEintraege(liste);
    setLaedt(false);
  }, []);

  useEffect(() => {
    ladeEintraege();
  }, [ladeEintraege]);

  const handleEntfernen = async (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await vonWunschlisteEntfernen(id);
    setEintraege((prev) => prev.filter((e) => e.id !== id));
  };

  if (!nutzerId || freigeschaltet === null) {
    return (
      <ScreenContainer>
        <View style={s.ladeContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  // Noch nicht freigeschaltet
  if (!freigeschaltet) {
    return (
      <ScreenContainer>
        <View style={s.gesperrtContainer}>
          <Pressable
            style={({ pressed }) => [s.zurueck, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Text style={s.zurueckText}>← Zurück</Text>
          </Pressable>
          <Text style={s.gesperrtEmoji}>🔒</Text>
          <Text style={s.gesperrtTitel}>Wunschliste noch gesperrt</Text>
          <Text style={s.gesperrtText}>
            Lade 3 Freunde ein, um die Wunschliste freizuschalten.
            Du kannst dann Höfe und Produkte merken und wirst benachrichtigt wenn sie verfügbar sind.
          </Text>
          <Pressable
            style={({ pressed }) => [s.einladenButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/freunde-einladen" as any)}
          >
            <Text style={s.einladenButtonText}>🌟 Freunde einladen</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.zurueck, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={s.zurueckText}>← Zurück</Text>
        </Pressable>
        <Text style={s.titel}>Wunschliste ❤️</Text>
        <Text style={s.untertitel}>{eintraege.length} gemerkte Einträge</Text>
      </View>

      {laedt ? (
        <View style={s.ladeContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : eintraege.length === 0 ? (
        <View style={s.leerContainer}>
          <Text style={s.leerEmoji}>🌱</Text>
          <Text style={s.leerTitel}>Noch nichts gemerkt</Text>
          <Text style={s.leerText}>
            Tippe auf das Herz-Symbol bei einem Hof oder Produkt, um es hier zu speichern.
          </Text>
          <Pressable
            style={({ pressed }) => [s.sucheButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/(tabs)" as any)}
          >
            <Text style={s.sucheButtonText}>🔍 Höfe entdecken</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={eintraege}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.liste}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.karte, pressed && { opacity: 0.8 }]}
              onPress={() => {
                if (item.typ === "hof") {
                  router.push(`/hof/${item.hofUserId}` as any);
                }
              }}
            >
              <View style={s.karteLinks}>
                <Text style={s.karteEmoji}>
                  {item.typ === "hof" ? "🏡" : (item.produktEmoji ?? "📦")}
                </Text>
                <View style={s.karteInfo}>
                  <Text style={s.karteName}>
                    {item.typ === "hof" ? item.hofName : item.produktName}
                  </Text>
                  {item.typ === "produkt" && (
                    <Text style={s.karteUntertitel}>{item.hofName}</Text>
                  )}
                  <Text style={s.karteDatum}>
                    Gemerkt am {new Date(item.hinzugefuegtAm).toLocaleDateString("de-DE")}
                  </Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [s.entfernenButton, pressed && { opacity: 0.6 }]}
                onPress={() => handleEntfernen(item.id)}
              >
                <Text style={s.entfernenText}>✕</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    ladeContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    zurueck: { marginBottom: 8 },
    zurueckText: { color: colors.primary, fontSize: 16 },
    titel: { fontSize: 26, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
    untertitel: { fontSize: 14, color: colors.muted },

    gesperrtContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    gesperrtEmoji: { fontSize: 56, marginBottom: 16 },
    gesperrtTitel: { fontSize: 22, fontWeight: "700", color: colors.foreground, marginBottom: 12, textAlign: "center" },
    gesperrtText: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    einladenButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
    },
    einladenButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    leerContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
    leerEmoji: { fontSize: 56, marginBottom: 16 },
    leerTitel: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginBottom: 8 },
    leerText: { fontSize: 15, color: colors.muted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
    sucheButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
    },
    sucheButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    liste: { padding: 16, gap: 10 },
    karte: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    karteLinks: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    karteEmoji: { fontSize: 28 },
    karteInfo: { flex: 1 },
    karteName: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 2 },
    karteUntertitel: { fontSize: 13, color: colors.muted, marginBottom: 2 },
    karteDatum: { fontSize: 12, color: colors.muted },
    entfernenButton: { padding: 8 },
    entfernenText: { fontSize: 16, color: colors.muted },
  });
