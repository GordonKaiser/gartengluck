import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { HofProdukt } from "@/shared/hofmarkt-types";
import { MODUL_LABELS } from "@/shared/hofmarkt-types";

const FAVORITEN_KEY = "gartengluck_favoriten";

interface FavoritHof {
  id: number;
  userId: number;
  hofName: string;
  ort: string | null;
  plz: string | null;
  distanzKm?: number;
}

export default function HofDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string; userId: string; hofName: string }>();
  const hofId = parseInt(params.id ?? "0");
  const userId = parseInt(params.userId ?? "0");
  const [istFavorit, setIstFavorit] = useState(false);

  const { data: profil, isLoading: profilLaed } = trpc.hofmarkt.hofProfil.useQuery(
    { hofId },
    { enabled: hofId > 0 }
  );
  const { data: produkte, isLoading: produkteLaden } = trpc.hofmarkt.hofProdukte.useQuery(
    { userId },
    { enabled: userId > 0 }
  );

  // Favoriten-Status prüfen
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
      const favoriten: FavoritHof[] = raw ? JSON.parse(raw) : [];
      setIstFavorit(favoriten.some((f) => f.id === hofId));
    })();
  }, [hofId]);

  const toggleFavorit = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
    let favoriten: FavoritHof[] = raw ? JSON.parse(raw) : [];
    if (istFavorit) {
      favoriten = favoriten.filter((f) => f.id !== hofId);
      setIstFavorit(false);
    } else {
      favoriten.push({
        id: hofId,
        userId,
        hofName: profil?.hofName ?? params.hofName ?? "Unbekannter Hof",
        ort: profil?.ort ?? null,
        plz: profil?.plz ?? null,
      });
      setIstFavorit(true);
    }
    await AsyncStorage.setItem(FAVORITEN_KEY, JSON.stringify(favoriten));
  }, [istFavorit, hofId, userId, profil, params.hofName]);

  const handleBestellen = useCallback(async () => {
    const link = profil?.shopLink;
    if (!link) {
      Alert.alert("Kein Shop-Link", "Dieser Hof hat noch keinen Shop-Link hinterlegt.");
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await WebBrowser.openBrowserAsync(link);
  }, [profil]);

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    headerTitel: {
      flex: 1,
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
    },
    favButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    profilBereich: {
      padding: 20,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    hofName: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      marginBottom: 4,
    },
    ortText: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 12,
    },
    beschreibung: {
      fontSize: 15,
      color: colors.foreground,
      lineHeight: 22,
    },
    bestellButton: {
      margin: 16,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    bestellButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    sektionHeader: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 8,
    },
    sektionTitel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    produktKarte: {
      marginHorizontal: 16,
      marginVertical: 4,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    produktEmoji: {
      fontSize: 28,
      width: 40,
      textAlign: "center",
    },
    produktInfo: {
      flex: 1,
    },
    produktName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 2,
    },
    produktPreis: {
      fontSize: 13,
      color: colors.muted,
    },
    verfuegbarBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    verfuegbarText: {
      fontSize: 12,
      fontWeight: "600",
    },
    ladeContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  if (profilLaed) {
    return (
      <ScreenContainer>
        <View style={styles.ladeContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Produkte nach Kategorie gruppieren
  const kategorien = ["gefluegel", "imkerei", "pilze", "garten", "holz"] as const;
  const produkteNachKategorie = kategorien.reduce(
    (acc, kat) => {
      const liste = (produkte ?? []).filter((p: HofProdukt) => p.kategorie === kat);
      if (liste.length > 0) acc[kat] = liste;
      return acc;
    },
    {} as Record<string, HofProdukt[]>
  );

  const renderProdukt = ({ item }: { item: HofProdukt }) => {
    const verfuegbarColor = item.verfuegbar ? colors.success : colors.warning;
    const verfuegbarText = item.verfuegbar
      ? "Verfügbar"
      : item.vorbestellungDatum
        ? `ab ${item.vorbestellungDatum}`
        : "Vorbestellung";

    return (
      <View style={[styles.produktKarte, !item.verfuegbar && { opacity: 0.7 }]}>
        <Text style={styles.produktEmoji}>{item.emoji}</Text>
        <View style={styles.produktInfo}>
          <Text style={styles.produktName}>{item.name}</Text>
          {item.preis && (
            <Text style={styles.produktPreis}>
              {parseFloat(item.preis).toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              / {item.einheit}
            </Text>
          )}
        </View>
        <View style={[styles.verfuegbarBadge, { backgroundColor: verfuegbarColor + "20" }]}>
          <Text style={[styles.verfuegbarText, { color: verfuegbarColor }]}>
            {verfuegbarText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitel} numberOfLines={1}>
          {profil?.hofName ?? params.hofName ?? "Hof"}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.favButton, pressed && { opacity: 0.7 }]}
          onPress={toggleFavorit}
        >
          <IconSymbol
            name={istFavorit ? "heart.fill" : "heart"}
            size={20}
            color={istFavorit ? colors.error : colors.muted}
          />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hof-Profil */}
        <View style={styles.profilBereich}>
          <Text style={styles.hofName}>{profil?.hofName ?? params.hofName}</Text>
          {(profil?.ort || profil?.plz) && (
            <Text style={styles.ortText}>
              📍 {[profil.ort, profil.plz].filter(Boolean).join(" · ")}
            </Text>
          )}
          {profil?.beschreibung && (
            <Text style={styles.beschreibung}>{profil.beschreibung}</Text>
          )}
        </View>

        {/* Bestell-Button */}
        {profil?.shopLink && (
          <Pressable
            style={({ pressed }) => [styles.bestellButton, pressed && { opacity: 0.85 }]}
            onPress={handleBestellen}
          >
            <IconSymbol name="cart.fill" size={20} color="#fff" />
            <Text style={styles.bestellButtonText}>Jetzt bestellen</Text>
          </Pressable>
        )}

        {/* Produkte */}
        {produkteLaden ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          Object.entries(produkteNachKategorie).map(([kat, liste]) => (
            <View key={kat}>
              <View style={styles.sektionHeader}>
                <Text style={styles.sektionTitel}>
                  {MODUL_LABELS[kat] ?? kat}
                </Text>
              </View>
              {liste.map((produkt, idx) => (
                <View key={idx}>{renderProdukt({ item: produkt })}</View>
              ))}
            </View>
          ))
        )}

        {/* Kein Shop-Link Hinweis */}
        {!profil?.shopLink && !produkteLaden && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
              Dieser Hof hat noch keinen direkten Bestelllink. Bitte nimm direkt Kontakt auf.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
