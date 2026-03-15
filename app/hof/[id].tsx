import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  type HofProfil,
  type HofProdukt,
  type HofProdukteAntwort,
  type Kategorie,
  KATEGORIE_MAP,
  formatPreis,
  ladeHofProfil,
  ladeHofProdukte,
} from "@/lib/hofmarkt-api";

const FAVORITEN_KEY = "gartengluck_favoriten";

interface FavoritHof {
  userId: number;
  hofName: string;
  ort: string | null;
  plz: string | null;
}

export default function HofDetailScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string; userId: string; hofName: string }>();
  const userId = parseInt(params.userId ?? params.id ?? "0");

  const [profil, setProfil] = useState<HofProfil | null>(null);
  const [produkteAntwort, setProdukteAntwort] = useState<HofProdukteAntwort | null>(null);
  const [profilLaed, setProfilLaed] = useState(true);
  const [produkteLaden, setProdukteLaden] = useState(true);
  const [istFavorit, setIstFavorit] = useState(false);
  const [aufgeklappteProdukte, setAufgeklappteProdukte] = useState<Set<string>>(new Set());

  const toggleProduktAufklappen = useCallback((produktId: string) => {
    setAufgeklappteProdukte((prev) => {
      const neu = new Set(prev);
      if (neu.has(produktId)) neu.delete(produktId);
      else neu.add(produktId);
      return neu;
    });
  }, []);

  // Daten laden
  useEffect(() => {
    if (userId <= 0) return;

    (async () => {
      setProfilLaed(true);
      const p = await ladeHofProfil(userId);
      setProfil(p);
      setProfilLaed(false);
    })();

    (async () => {
      setProdukteLaden(true);
      try {
        const pa = await ladeHofProdukte(userId);
        setProdukteAntwort(pa);
      } catch {
        setProdukteAntwort(null);
      }
      setProdukteLaden(false);
    })();
  }, [userId]);

  // Favoriten-Status prüfen
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
      const favoriten: FavoritHof[] = raw ? JSON.parse(raw) : [];
      setIstFavorit(favoriten.some((f) => f.userId === userId));
    })();
  }, [userId]);

  const toggleFavorit = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
    let favoriten: FavoritHof[] = raw ? JSON.parse(raw) : [];
    if (istFavorit) {
      favoriten = favoriten.filter((f) => f.userId !== userId);
      setIstFavorit(false);
    } else {
      favoriten.push({
        userId,
        hofName: profil?.hofName ?? params.hofName ?? "Unbekannter Hof",
        ort: profil?.ort ?? null,
        plz: profil?.plz ?? null,
      });
      setIstFavorit(true);
    }
    await AsyncStorage.setItem(FAVORITEN_KEY, JSON.stringify(favoriten));
  }, [istFavorit, userId, profil, params.hofName]);

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
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    sektionEmoji: {
      fontSize: 16,
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
    produktBeschreibung: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 16,
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
    keinProduktText: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      padding: 20,
    },
    mehrAnzeigenText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
      fontWeight: "600" as const,
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

  // Produkte nach Kategorie gruppieren (Reihenfolge aus API)
  const kategorieReihenfolge: Kategorie[] = produkteAntwort?.kategorien ?? [];
  const produkteNachKategorie: Record<string, HofProdukt[]> = {};
  for (const kat of kategorieReihenfolge) {
    const liste = (produkteAntwort?.produkte ?? []).filter((p) => p.kategorie === kat);
    if (liste.length > 0) produkteNachKategorie[kat] = liste;
  }

  const renderProdukt = (produkt: HofProdukt) => {
    const meta = KATEGORIE_MAP[produkt.kategorie];
    const verfuegbarColor = produkt.verfuegbar ? colors.success : colors.warning;
    const verfuegbarText = produkt.verfuegbar
      ? "Verfügbar"
      : produkt.vorbestellungDatum
        ? `ab ${produkt.vorbestellungDatum}`
        : "Vorbestellung";
    const beschreibungLang = (produkt.beschreibung?.length ?? 0) > 80;
    const istAufgeklappt = aufgeklappteProdukte.has(produkt.id);

    return (
      <Pressable
        key={produkt.id}
        style={({ pressed }) => [
          styles.produktKarte,
          !produkt.verfuegbar && { opacity: 0.7 },
          pressed && { opacity: 0.85 },
        ]}
        onPress={beschreibungLang ? () => toggleProduktAufklappen(produkt.id) : undefined}
      >
        <Text style={styles.produktEmoji}>{meta?.emoji ?? "🌿"}</Text>
        <View style={styles.produktInfo}>
          <Text style={styles.produktName}>{produkt.name}</Text>
          <Text style={styles.produktPreis}>{formatPreis(produkt.preis, produkt.einheit)}</Text>
          {produkt.beschreibung && (
            <>
              <Text
                style={styles.produktBeschreibung}
                numberOfLines={istAufgeklappt ? undefined : 2}
              >
                {produkt.beschreibung}
              </Text>
              {beschreibungLang && (
                <Text style={styles.mehrAnzeigenText}>
                  {istAufgeklappt ? "Weniger anzeigen ▴" : "Mehr anzeigen ▾"}
                </Text>
              )}
            </>
          )}
        </View>
        <View style={[styles.verfuegbarBadge, { backgroundColor: verfuegbarColor + "20" }]}>
          <Text style={[styles.verfuegbarText, { color: verfuegbarColor }]}>
            {verfuegbarText}
          </Text>
        </View>
      </Pressable>
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
              📍 {[profil?.ort, profil?.plz].filter(Boolean).join(" · ")}
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
            <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>
              Produkte werden geladen…
            </Text>
          </View>
        ) : Object.keys(produkteNachKategorie).length > 0 ? (
          Object.entries(produkteNachKategorie).map(([kat, liste]) => {
            const meta = KATEGORIE_MAP[kat as Kategorie];
            return (
              <View key={kat}>
                <View style={styles.sektionHeader}>
                  <Text style={styles.sektionEmoji}>{meta?.emoji ?? "🌿"}</Text>
                  <Text style={styles.sektionTitel}>{meta?.label ?? kat}</Text>
                </View>
                {liste.map(renderProdukt)}
              </View>
            );
          })
        ) : (
          <Text style={styles.keinProduktText}>
            Dieser Hof hat noch keine Produkte eingetragen.
          </Text>
        )}

        {/* Kein Shop-Link Hinweis */}
        {!profil?.shopLink && !produkteLaden && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
              Dieser Hof hat noch keinen direkten Bestelllink.{"\n"}Bitte nimm direkt Kontakt auf.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
