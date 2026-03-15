import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

interface FavoritHof {
  userId: number;
  hofName: string;
  ort: string | null;
  plz: string | null;
  distanzKm?: number;
}

export default function FavoritenScreen() {
  const colors = useColors();
  const [favoriten, setFavoriten] = useState<FavoritHof[]>([]);
  const [nutzer, setNutzer] = useState<NutzerProfil | null>(null);

  // Nutzerprofil laden
  useEffect(() => {
    ladeNutzerProfil().then(setNutzer);
  }, []);

  // Bei jedem Tab-Fokus Favoriten neu laden
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
        setFavoriten(raw ? JSON.parse(raw) : []);
        const profil = await ladeNutzerProfil();
        setNutzer(profil);
      })();
    }, [])
  );

  const handleEntfernen = useCallback(async (userId: number) => {
    const aktualisiert = favoriten.filter((f) => f.userId !== userId);
    setFavoriten(aktualisiert);
    await AsyncStorage.setItem(FAVORITEN_KEY, JSON.stringify(aktualisiert));
  }, [favoriten]);

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
      style={({ pressed }) => [s.hofKarte, pressed && { opacity: 0.75 }]}
      onPress={() =>
        router.push({
          pathname: "/hof/[id]" as any,
          params: { id: item.userId, userId: item.userId, hofName: item.hofName },
        })
      }
    >
      <View style={s.hofInfo}>
        <Text style={s.hofName} numberOfLines={1}>
          {item.hofName}
        </Text>
        {(item.ort || item.plz) && (
          <Text style={s.hofOrt}>
            📍 {[item.plz, item.ort].filter(Boolean).join(" ")}
          </Text>
        )}
        {item.distanzKm !== undefined && (
          <Text style={s.distanz}>ca. {item.distanzKm.toFixed(1)} km entfernt</Text>
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

  return (
    <ScreenContainer>
      {/* Header mit Nutzerprofil */}
      <View style={s.header}>
        <Text style={s.titel}>Favoriten</Text>
        {nutzer && (
          <View style={s.nutzerBereich}>
            <View style={s.nutzerInfo}>
              <Text style={s.nutzerName}>👤 {nutzer.name}</Text>
              <Text style={s.nutzerTelefon}>{nutzer.telefon}</Text>
              {nutzer.ort && (
                <Text style={s.nutzerOrt}>📍 {[nutzer.plz, nutzer.ort].filter(Boolean).join(" ")}</Text>
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

      {favoriten.length === 0 ? (
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
      ) : (
        <FlatList
          data={favoriten}
          keyExtractor={(item) => String(item.userId)}
          renderItem={renderFavorit}
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
    nutzerInfo: {
      flex: 1,
    },
    nutzerName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 2,
    },
    nutzerTelefon: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 2,
    },
    nutzerOrt: {
      fontSize: 13,
      color: colors.muted,
    },
    abmeldenButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.error + "15",
      marginLeft: 12,
      alignSelf: "flex-start",
    },
    abmeldenText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: "600",
    },
    hofKarte: {
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
    hofInfo: {
      flex: 1,
    },
    hofName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 3,
    },
    hofOrt: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 2,
    },
    distanz: {
      fontSize: 12,
      color: colors.muted,
    },
    aktionen: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 12,
    },
    hofButton: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    hofButtonText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    entfernenButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.error + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    leerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    leerEmoji: {
      fontSize: 56,
      marginBottom: 16,
    },
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
    entdeckenButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
  });
