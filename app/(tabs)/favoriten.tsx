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
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ladeNutzerProfil, loescheNutzerProfil, type NutzerProfil } from "@/lib/nutzer-store";

const FAVORITEN_KEY = "gartengluck_favoriten";
const BESTELLHISTORIE_KEY = "gartengluck_bestellhistorie";

interface FavoritHof {
  userId: number;
  hofName: string;
  ort: string | null;
  plz: string | null;
  distanzKm?: number;
}

export interface BestellHistorieEintrag {
  userId: number;
  hofName: string;
  ort: string | null;
  datum: string; // ISO-String
  shopLink: string | null;
}

type AktivTab = "favoriten" | "bestellungen";

export default function FavoritenScreen() {
  const colors = useColors();
  const [favoriten, setFavoriten] = useState<FavoritHof[]>([]);
  const [bestellungen, setBestellungen] = useState<BestellHistorieEintrag[]>([]);
  const [nutzer, setNutzer] = useState<NutzerProfil | null>(null);
  const [aktivTab, setAktivTab] = useState<AktivTab>("favoriten");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [raw, bestellRaw, profil] = await Promise.all([
          AsyncStorage.getItem(FAVORITEN_KEY),
          AsyncStorage.getItem(BESTELLHISTORIE_KEY),
          ladeNutzerProfil(),
        ]);
        setFavoriten(raw ? JSON.parse(raw) : []);
        setBestellungen(bestellRaw ? JSON.parse(bestellRaw) : []);
        setNutzer(profil);
      })();
    }, [])
  );

  const handleEntfernen = useCallback(
    async (userId: number) => {
      const aktualisiert = favoriten.filter((f) => f.userId !== userId);
      setFavoriten(aktualisiert);
      await AsyncStorage.setItem(FAVORITEN_KEY, JSON.stringify(aktualisiert));
    },
    [favoriten]
  );

  const handleBestellungLoeschen = useCallback(
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

  const handleAbmelden = () => {
    Alert.alert(
      "Abmelden",
      "Möchtest du dich wirklich abmelden? Deine Favoriten bleiben gespeichert.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Abmelden",
          style: "destructive",
          onPress: async () => {
            await loescheNutzerProfil();
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  const s = styles(colors);

  const renderFavorit = ({ item }: { item: FavoritHof }) => (
    <Pressable
      style={({ pressed }) => [s.karte, pressed && { opacity: 0.75 }]}
      onPress={() =>
        router.push({
          pathname: "/hof/[id]" as any,
          params: { id: item.userId, userId: item.userId, hofName: item.hofName },
        })
      }
    >
      <View style={s.karteInfo}>
        <Text style={s.karteName} numberOfLines={1}>
          {item.hofName}
        </Text>
        {(item.ort || item.plz) && (
          <Text style={s.karteOrt}>
            📍 {[item.plz, item.ort].filter(Boolean).join(" ")}
          </Text>
        )}
        {item.distanzKm !== undefined && (
          <Text style={s.karteZusatz}>ca. {item.distanzKm.toFixed(1)} km entfernt</Text>
        )}
      </View>
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
          style={({ pressed }) => [s.entfernenButton, pressed && { opacity: 0.7 }]}
          onPress={() => handleEntfernen(item.userId)}
        >
          <IconSymbol name="heart.fill" size={16} color={colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderBestellung = ({
    item,
    index,
  }: {
    item: BestellHistorieEintrag;
    index: number;
  }) => {
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

    return (
      <View style={s.karte}>
        <View style={s.karteInfo}>
          <Text style={s.karteName} numberOfLines={1}>
            🛒 {item.hofName}
          </Text>
          {item.ort && <Text style={s.karteOrt}>📍 {item.ort}</Text>}
          <Text style={s.karteZusatz}>
            {datumText} um {zeitText} Uhr
          </Text>
        </View>
        <View style={s.aktionen}>
          {item.shopLink && (
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
          )}
          <Pressable
            style={({ pressed }) => [s.entfernenButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleBestellungLoeschen(index)}
          >
            <Text style={{ fontSize: 14, color: colors.muted }}>✕</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const leerFavoriten = (
    <View style={s.leerContainer}>
      <Text style={s.leerEmoji}>🤍</Text>
      <Text style={s.leerTitel}>Noch keine Favoriten</Text>
      <Text style={s.leerText}>
        Tippe auf das Herz-Symbol auf einem Hof-Profil, um ihn als Favorit zu speichern.
      </Text>
      <Pressable
        style={({ pressed }) => [s.entdeckenButton, pressed && { opacity: 0.8 }]}
        onPress={() => router.push("/")}
      >
        <Text style={s.entdeckenButtonText}>Höfe entdecken</Text>
      </Pressable>
    </View>
  );

  const leerBestellungen = (
    <View style={s.leerContainer}>
      <Text style={s.leerEmoji}>📋</Text>
      <Text style={s.leerTitel}>Noch keine Bestellungen</Text>
      <Text style={s.leerText}>
        Wenn du auf "Jetzt bestellen" tippst, wird der Hof hier gespeichert.
      </Text>
      <Pressable
        style={({ pressed }) => [s.entdeckenButton, pressed && { opacity: 0.8 }]}
        onPress={() => router.push("/")}
      >
        <Text style={s.entdeckenButtonText}>Höfe entdecken</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header mit Nutzerprofil */}
      <View style={s.header}>
        <Text style={s.titel}>Mein Bereich</Text>
        {nutzer && (
          <View style={s.nutzerBereich}>
            <View style={s.nutzerInfo}>
              <Text style={s.nutzerName}>👤 {nutzer.name}</Text>
              <Text style={s.nutzerTelefon}>{nutzer.telefon}</Text>
              {nutzer.ort && (
                <Text style={s.nutzerOrt}>
                  📍 {[nutzer.plz, nutzer.ort].filter(Boolean).join(" ")}
                </Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [s.abmeldenButton, pressed && { opacity: 0.7 }]}
              onPress={handleAbmelden}
            >
              <Text style={s.abmeldenText}>Abmelden</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Tab-Leiste */}
      <View style={s.tabLeiste}>
        <Pressable
          style={[s.tabButton, aktivTab === "favoriten" && s.tabButtonAktiv]}
          onPress={() => setAktivTab("favoriten")}
        >
          <Text style={[s.tabText, aktivTab === "favoriten" && s.tabTextAktiv]}>
            ❤️ Favoriten {favoriten.length > 0 ? `(${favoriten.length})` : ""}
          </Text>
        </Pressable>
        <Pressable
          style={[s.tabButton, aktivTab === "bestellungen" && s.tabButtonAktiv]}
          onPress={() => setAktivTab("bestellungen")}
        >
          <Text style={[s.tabText, aktivTab === "bestellungen" && s.tabTextAktiv]}>
            🛒 Bestellungen {bestellungen.length > 0 ? `(${bestellungen.length})` : ""}
          </Text>
        </Pressable>
      </View>

      {aktivTab === "favoriten" ? (
        favoriten.length === 0 ? (
          leerFavoriten
        ) : (
          <FlatList
            data={favoriten}
            keyExtractor={(item) => String(item.userId)}
            renderItem={renderFavorit}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : bestellungen.length === 0 ? (
        leerBestellungen
      ) : (
        <FlatList
          data={[...bestellungen].reverse()}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item, index }) =>
            renderBestellung({ item, index: bestellungen.length - 1 - index })
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
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
      paddingBottom: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    titel: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
    },
    nutzerBereich: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nutzerInfo: { flex: 1 },
    nutzerName: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 2 },
    nutzerTelefon: { fontSize: 13, color: colors.muted, marginBottom: 2 },
    nutzerOrt: { fontSize: 13, color: colors.muted },
    abmeldenButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.error + "15",
      marginLeft: 12,
      alignSelf: "flex-start",
    },
    abmeldenText: { fontSize: 13, color: colors.error, fontWeight: "600" },
    // Tab-Leiste
    tabLeiste: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabButtonAktiv: {
      backgroundColor: colors.primary + "18",
      borderColor: colors.primary,
    },
    tabText: { fontSize: 13, fontWeight: "600", color: colors.muted },
    tabTextAktiv: { color: colors.primary },
    // Karten
    karte: {
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    karteInfo: { flex: 1 },
    karteName: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 3 },
    karteOrt: { fontSize: 13, color: colors.muted, marginBottom: 2 },
    karteZusatz: { fontSize: 12, color: colors.muted },
    aktionen: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 12 },
    hofButton: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    hofButtonText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
    entfernenButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    // Leer-Zustand
    leerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    leerEmoji: { fontSize: 56, marginBottom: 16 },
    leerTitel: {
      fontSize: 18, fontWeight: "700", color: colors.foreground,
      textAlign: "center", marginBottom: 8,
    },
    leerText: {
      fontSize: 14, color: colors.muted, textAlign: "center",
      lineHeight: 20, marginBottom: 24,
    },
    entdeckenButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    entdeckenButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });
