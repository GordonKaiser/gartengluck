import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const FAVORITEN_KEY = "gartengluck_favoriten";

interface FavoritHof {
  id: number;
  userId: number;
  hofName: string;
  ort: string | null;
  plz: string | null;
  distanzKm?: number;
}

export default function FavoritenScreen() {
  const colors = useColors();
  const [favoriten, setFavoriten] = useState<FavoritHof[]>([]);

  // Bei jedem Tab-Fokus neu laden
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
        setFavoriten(raw ? JSON.parse(raw) : []);
      })();
    }, [])
  );

  const handleEntfernen = useCallback(async (id: number) => {
    const aktualisiert = favoriten.filter((f) => f.id !== id);
    setFavoriten(aktualisiert);
    await AsyncStorage.setItem(FAVORITEN_KEY, JSON.stringify(aktualisiert));
  }, [favoriten]);

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
    },
    entfernenButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.error + "15",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
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

  const renderFavorit = ({ item }: { item: FavoritHof }) => (
    <Pressable
      style={({ pressed }) => [styles.hofKarte, pressed && { opacity: 0.75 }]}
      onPress={() =>
        router.push({
          pathname: "/hof/[id]" as any,
          params: { id: item.id, userId: item.userId, hofName: item.hofName },
        })
      }
    >
      <View style={styles.hofInfo}>
        <Text style={styles.hofName} numberOfLines={1}>
          {item.hofName}
        </Text>
        {(item.ort || item.plz) && (
          <Text style={styles.hofOrt}>
            📍 {[item.ort, item.plz].filter(Boolean).join(" · ")}
          </Text>
        )}
      </View>
      <Pressable
        style={({ pressed }) => [styles.entfernenButton, pressed && { opacity: 0.7 }]}
        onPress={() => handleEntfernen(item.id)}
      >
        <IconSymbol name="heart.fill" size={16} color={colors.error} />
      </Pressable>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.titel}>Favoriten</Text>
      </View>

      {favoriten.length === 0 ? (
        <View style={styles.leerContainer}>
          <Text style={styles.leerEmoji}>🤍</Text>
          <Text style={styles.leerTitel}>Noch keine Favoriten</Text>
          <Text style={styles.leerText}>
            Tippe auf das Herz-Symbol auf einem Hof-Profil, um ihn als Favorit zu speichern.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.entdeckenButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push("/")}
          >
            <Text style={styles.entdeckenButtonText}>Höfe entdecken</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favoriten}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFavorit}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
