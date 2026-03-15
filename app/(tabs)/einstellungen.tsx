import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
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
      const favoriten = raw ? JSON.parse(raw) : [];
      setFavoritenAnzahl(favoriten.length);
    })();
  }, []);

  const handleFavoritenLoeschen = useCallback(() => {
    Alert.alert(
      "Favoriten löschen",
      "Möchtest du alle gespeicherten Favoriten löschen?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(FAVORITEN_KEY);
            setFavoritenAnzahl(0);
          },
        },
      ]
    );
  }, []);

  const handleDarkModeToggle = useCallback(() => {
    setColorScheme(isDark ? "light" : "dark");
  }, [isDark, setColorScheme]);

  const styles = StyleSheet.create({
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
    },
    sektion: {
      marginTop: 24,
      marginHorizontal: 16,
    },
    sektionTitel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    sektionKarte: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    zeile: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
    },
    trennlinie: {
      height: 0.5,
      backgroundColor: colors.border,
      marginLeft: 16,
    },
    zeileTitel: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
    },
    zeileWert: {
      fontSize: 15,
      color: colors.muted,
    },
    destructiveText: {
      fontSize: 15,
      color: colors.error,
    },
    versionText: {
      textAlign: "center",
      fontSize: 12,
      color: colors.muted,
      marginTop: 32,
      marginBottom: 16,
    },
  });

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.titel}>Einstellungen</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Darstellung */}
        <View style={styles.sektion}>
          <Text style={styles.sektionTitel}>Darstellung</Text>
          <View style={styles.sektionKarte}>
            <View style={styles.zeile}>
              <Text style={styles.zeileTitel}>Dunkles Design</Text>
              <Switch
                value={isDark}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Suche */}
        <View style={styles.sektion}>
          <Text style={styles.sektionTitel}>Suche</Text>
          <View style={styles.sektionKarte}>
            <View style={styles.zeile}>
              <Text style={styles.zeileTitel}>Letzte PLZ</Text>
              <Text style={styles.zeileWert}>{gespeichertePlz ?? "–"}</Text>
            </View>
          </View>
        </View>

        {/* Daten */}
        <View style={styles.sektion}>
          <Text style={styles.sektionTitel}>Daten</Text>
          <View style={styles.sektionKarte}>
            <View style={styles.zeile}>
              <Text style={styles.zeileTitel}>Gespeicherte Favoriten</Text>
              <Text style={styles.zeileWert}>{favoritenAnzahl}</Text>
            </View>
            {favoritenAnzahl > 0 && (
              <>
                <View style={styles.trennlinie} />
                <Pressable
                  style={({ pressed }) => [styles.zeile, pressed && { opacity: 0.7 }]}
                  onPress={handleFavoritenLoeschen}
                >
                  <Text style={styles.destructiveText}>Alle Favoriten löschen</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Rechtliches */}
        <View style={styles.sektion}>
          <Text style={styles.sektionTitel}>Rechtliches</Text>
          <View style={styles.sektionKarte}>
            <Pressable
              style={({ pressed }) => [styles.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => WebBrowser.openBrowserAsync("https://manus.im/privacy")}
            >
              <Text style={styles.zeileTitel}>Datenschutz</Text>
              <Text style={styles.zeileWert}>›</Text>
            </Pressable>
            <View style={styles.trennlinie} />
            <Pressable
              style={({ pressed }) => [styles.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => WebBrowser.openBrowserAsync("https://manus.im/terms")}
            >
              <Text style={styles.zeileTitel}>Nutzungsbedingungen</Text>
              <Text style={styles.zeileWert}>›</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.versionText}>Gartenglück v{version}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
