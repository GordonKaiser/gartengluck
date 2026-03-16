/**
 * LocaBuy – Einstellungen
 * Admin-Bereich vollständig entfernt (kein Angriffspunkt für Nutzer).
 */

import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

const FAVORITEN_KEY = "gartengluck_favoriten";
const STORAGE_PLZ_KEY = "gartengluck_letzte_plz";

export default function EinstellungenScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [gespeichertePlz, setGespeichertePlz] = useState<string | null>(null);
  const [favoritenAnzahl, setFavoritenAnzahl] = useState(0);
  const isDark = colorScheme === "dark";

  useEffect(() => {
    (async () => {
      const plz = await AsyncStorage.getItem(STORAGE_PLZ_KEY);
      setGespeichertePlz(plz);
      const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
      setFavoritenAnzahl(raw ? JSON.parse(raw).length : 0);
    })();
  }, []);

  const handleFavoritenLoeschen = useCallback(() => {
    Alert.alert("Favoriten löschen", "Möchtest du alle gespeicherten Favoriten löschen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(FAVORITEN_KEY);
          setFavoritenAnzahl(0);
        },
      },
    ]);
  }, []);

  const s = styles(colors);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Text style={s.titel}>Einstellungen</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Darstellung */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Darstellung</Text>
          <View style={s.sektionKarte}>
            <View style={s.zeile}>
              <Text style={s.zeileTitel}>Dunkles Design</Text>
              <Switch
                value={isDark}
                onValueChange={() => setColorScheme(isDark ? "light" : "dark")}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Sicherheit */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Sicherheit</Text>
          <View style={s.sektionKarte}>
            <Pressable
              style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/pin-einrichten" as any)}
            >
              <Text style={s.zeileTitel}>🔒 App-PIN einrichten</Text>
              <Text style={s.zeileWert}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* Suche */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Suche</Text>
          <View style={s.sektionKarte}>
            <View style={s.zeile}>
              <Text style={s.zeileTitel}>Letzte PLZ</Text>
              <Text style={s.zeileWert}>{gespeichertePlz ?? "–"}</Text>
            </View>
          </View>
        </View>

        {/* Daten */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Daten</Text>
          <View style={s.sektionKarte}>
            <View style={s.zeile}>
              <Text style={s.zeileTitel}>Gespeicherte Favoriten</Text>
              <Text style={s.zeileWert}>{favoritenAnzahl}</Text>
            </View>
            {favoritenAnzahl > 0 && (
              <>
                <View style={s.trennlinie} />
                <Pressable
                  style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
                  onPress={handleFavoritenLoeschen}
                >
                  <Text style={s.destructiveText}>Alle Favoriten löschen</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Rechtliches */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Rechtliches</Text>
          <View style={s.sektionKarte}>
            <Pressable
              style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/datenschutz" as any)}
            >
              <Text style={s.zeileTitel}>Datenschutzerklärung</Text>
              <Text style={s.zeileWert}>›</Text>
            </Pressable>
            <View style={s.trennlinie} />
            <Pressable
              style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/nutzungsbedingungen" as any)}
            >
              <Text style={s.zeileTitel}>Nutzungsbedingungen</Text>
              <Text style={s.zeileWert}>›</Text>
            </Pressable>
            <View style={s.trennlinie} />
            <Pressable
              style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/impressum" as any)}
            >
              <Text style={s.zeileTitel}>Impressum</Text>
              <Text style={s.zeileWert}>›</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.versionText}>LocaBuy v{version}</Text>
      </ScrollView>
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
    titel: { fontSize: 28, fontWeight: "700", color: colors.foreground },
    sektion: { marginTop: 24, marginHorizontal: 16 },
    sektionTitel: {
      fontSize: 12, fontWeight: "700", color: colors.muted,
      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
    },
    sektionKarte: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: "hidden",
    },
    zeile: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 14, minHeight: 52,
    },
    trennlinie: { height: 0.5, backgroundColor: colors.border, marginLeft: 16 },
    zeileTitel: { flex: 1, fontSize: 15, color: colors.foreground },
    zeileWert: { fontSize: 15, color: colors.muted },
    destructiveText: { fontSize: 15, color: colors.error },
    versionText: {
      textAlign: "center", fontSize: 12, color: colors.muted, marginTop: 32, marginBottom: 16,
    },
  });
