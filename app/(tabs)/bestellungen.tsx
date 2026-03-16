/**
 * Gartenglück – Meine Bestellungen
 * Separater Tab für die Bestellhistorie mit Status-Anzeige.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const BESTELLHISTORIE_KEY = "gartengluck_bestellhistorie";

export interface BestellHistorieEintrag {
  id?: number;
  userId: number;
  hofName: string;
  ort: string | null;
  datum: string;
  shopLink: string | null;
  gesamtpreis?: number;
  anzahlProdukte?: number;
  status?: "neu" | "bestaetigt" | "abholbereit" | "abgeholt" | "storniert";
  bewertungAbgegeben?: boolean;
}

export default function BestellungenScreen() {
  const colors = useColors();
  const [bestellungen, setBestellungen] = useState<BestellHistorieEintrag[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
        setBestellungen(raw ? JSON.parse(raw) : []);
      })();
    }, [])
  );

  const handleLoeschen = useCallback(
    async (index: number) => {
      Alert.alert("Eintrag löschen", "Diesen Eintrag aus der Historie entfernen?", [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            const aktualisiert = bestellungen.filter((_, i) => i !== index);
            setBestellungen(aktualisiert);
            await AsyncStorage.setItem(BESTELLHISTORIE_KEY, JSON.stringify(aktualisiert));
          },
        },
      ]);
    },
    [bestellungen]
  );

  const s = styles(colors);

  const statusInfo: Record<string, { label: string; farbe: string; emoji: string }> = {
    neu:         { label: "Neu",         farbe: colors.warning,  emoji: "⏳" },
    bestaetigt:  { label: "Bestätigt",   farbe: colors.success,  emoji: "✅" },
    abholbereit: { label: "Abholbereit", farbe: colors.primary,  emoji: "📦" },
    abgeholt:    { label: "Abgeholt",    farbe: colors.muted,    emoji: "🎉" },
    storniert:   { label: "Storniert",   farbe: colors.error,    emoji: "❌" },
  };

  const renderBestellung = ({
    item,
    index,
  }: {
    item: BestellHistorieEintrag;
    index: number;
  }) => {
    const realIndex = bestellungen.length - 1 - index;
    const datum = new Date(item.datum);
    const datumText = datum.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const zeitText = datum.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const status = statusInfo[item.status ?? "neu"] ?? statusInfo.neu;

    return (
      <View style={s.karte}>
        <View style={s.karteHeader}>
          <Text style={s.hofName}>{item.hofName}</Text>
          <View style={[s.statusBadge, { backgroundColor: status.farbe + "20" }]}>
            <Text style={[s.statusText, { color: status.farbe }]}>
              {status.emoji} {status.label}
            </Text>
          </View>
        </View>

        {item.ort && <Text style={s.ort}>📍 {item.ort}</Text>}

        <Text style={s.datum}>
          {datumText} um {zeitText} Uhr
          {item.gesamtpreis !== undefined
            ? ` · ${item.gesamtpreis.toFixed(2).replace(".", ",")} €`
            : ""}
        </Text>

        {item.id && (
          <Text style={s.bestellnr}>Bestellnr. #{item.id}</Text>
        )}

        {item.status === "abgeholt" && !item.bewertungAbgegeben && (
          <Pressable
            style={({ pressed }) => [s.bewertungButton, pressed && { opacity: 0.8 }]}
            onPress={() =>
              router.push({
                pathname: "/bewertung" as any,
                params: {
                  bestellIndex: String(realIndex),
                  hofName: item.hofName,
                  userId: String(item.userId),
                },
              })
            }
          >
            <Text style={s.bewertungButtonText}>⭐ Bewertung abgeben</Text>
          </Pressable>
        )}
        {item.bewertungAbgegeben && (
          <Text style={s.bewertungAbgegeben}>✔️ Bewertung abgegeben</Text>
        )}

        <View style={s.aktionen}>
          <Pressable
            style={({ pressed }) => [s.hofButton, pressed && { opacity: 0.7 }]}
            onPress={() =>
              router.push({
                pathname: "/hof/[id]" as any,
                params: { id: item.userId, userId: item.userId, hofName: item.hofName },
              })
            }
          >
            <Text style={s.hofButtonText}>Zum Hof →</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.loeschenButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleLoeschen(realIndex)}
          >
            <Text style={s.loeschenText}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Text style={s.titel}>Meine Bestellungen</Text>
        {bestellungen.length > 0 && (
          <Text style={s.anzahl}>{bestellungen.length} Bestellung{bestellungen.length !== 1 ? "en" : ""}</Text>
        )}
      </View>

      {bestellungen.length === 0 ? (
        <View style={s.leerContainer}>
          <Text style={s.leerEmoji}>📋</Text>
          <Text style={s.leerTitel}>Noch keine Bestellungen</Text>
          <Text style={s.leerText}>
            Wenn du auf einem Hof bestellst, erscheint die Bestellung hier mit aktuellem Status.
          </Text>
          <Pressable
            style={({ pressed }) => [s.entdeckenButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/")}
          >
            <Text style={s.entdeckenButtonText}>Höfe entdecken</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={[...bestellungen].reverse()}
          keyExtractor={(_, index) => String(index)}
          renderItem={renderBestellung}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    titel: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
    },
    anzahl: {
      fontSize: 14,
      color: colors.muted,
    },
    karte: {
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    karteHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      gap: 8,
    },
    hofName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      flexShrink: 0,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    ort: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 3,
    },
    datum: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 3,
    },
    bestellnr: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 10,
    },
    aktionen: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    hofButton: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
    },
    hofButtonText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    loeschenButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    loeschenText: {
      fontSize: 14,
      color: colors.muted,
    },
    leerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    leerEmoji: { fontSize: 56, marginBottom: 16 },
    leerTitel: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 8,
    },
    leerText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    entdeckenButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    entdeckenButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
    bewertungButton: {
      backgroundColor: colors.warning + "20",
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: "center",
      marginBottom: 8,
      marginTop: 4,
    },
    bewertungButtonText: {
      fontSize: 13,
      color: colors.warning,
      fontWeight: "600",
    },
    bewertungAbgegeben: {
      fontSize: 12,
      color: colors.success,
      marginBottom: 8,
      marginTop: 4,
    },
  });
