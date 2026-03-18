import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  type HofProfil,
  type HofProdukt,
  type HofProdukteAntwort,
  type HofBewertungenAntwort,
  type Kategorie,
  KATEGORIE_MAP,
  formatPreis,
  ladeHofProfil,
  ladeHofProdukte,
  ladeHofBewertungen,
} from "@/lib/hofmarkt-api";
import { useWarenkorb } from "@/lib/warenkorb-store";
import { aufWunschlisteSetzen, vonWunschlisteEntfernen, istAufWunschliste } from "@/lib/wunschliste-store";
import { ladeNutzerProfil } from "@/lib/nutzer-store";
import { trpc } from "@/lib/trpc";

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
  const [istAufWunschlisteState, setIstAufWunschlisteState] = useState(false);
  const [nutzerId, setNutzerId] = useState<number | null>(null);
  const [hatWunschliste, setHatWunschliste] = useState(false);

  const wunschlisteStatusQuery = trpc.referral.meinStatus.useQuery(
    { nutzerId: nutzerId ?? 0 },
    { enabled: !!nutzerId }
  );
  const [bewertungen, setBewertungen] = useState<HofBewertungenAntwort | null>(null);
  const [vollbildIndex, setVollbildIndex] = useState<number | null>(null);
  const vollbildRef = useRef<FlatList>(null);

  const { warenkorb, gesamtpreis, gesamtAnzahl, setzeHof, setze, erhoehe, verringere } = useWarenkorb();

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

    (async () => {
      const bw = await ladeHofBewertungen(userId);
      setBewertungen(bw);
    })();
  }, [userId]);

  // Hof im Warenkorb registrieren sobald Profil geladen
  useEffect(() => {
    if (profil) {
      setzeHof(profil.userId, profil.hofName);
    }
  }, [profil, setzeHof]);

  // Favoriten-Status prüfen
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(FAVORITEN_KEY);
      const favoriten: FavoritHof[] = raw ? JSON.parse(raw) : [];
      setIstFavorit(favoriten.some((f) => f.userId === userId));
    })();
  }, [userId]);

  // Nutzer-ID und Wunschliste-Status laden
  useEffect(() => {
    ladeNutzerProfil().then((p) => { if (p?.id) setNutzerId(p.id); });
    istAufWunschliste(`hof_${userId}`).then(setIstAufWunschlisteState);
  }, [userId]);

  useEffect(() => {
    if (wunschlisteStatusQuery.data) {
      setHatWunschliste(wunschlisteStatusQuery.data.hatWunschliste);
    }
  }, [wunschlisteStatusQuery.data]);

  const toggleWunschliste = useCallback(async () => {
    if (!profil) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const id = `hof_${userId}`;
    if (istAufWunschlisteState) {
      await vonWunschlisteEntfernen(id);
      setIstAufWunschlisteState(false);
    } else {
      await aufWunschlisteSetzen({ id, typ: "hof", hofUserId: userId, hofName: profil.hofName });
      setIstAufWunschlisteState(true);
    }
  }, [istAufWunschlisteState, userId, profil]);

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

  const handleWarenkorbOeffnen = useCallback(() => {
    if (gesamtAnzahl === 0) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: "/bestellung",
      params: {
        hofUserId: String(userId),
        hofName: profil?.hofName ?? params.hofName ?? "Hof",
      },
    } as never);
  }, [gesamtAnzahl, userId, profil, params.hofName]);

  const handleMengeAendern = useCallback(
    (produkt: HofProdukt, delta: number) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (delta > 0) {
        const aktuelle = warenkorb?.positionen.find((p) => p.produkt.id === produkt.id)?.menge ?? 0;
        setze(produkt, aktuelle + 1);
      } else {
        verringere(produkt.id);
      }
    },
    [warenkorb, setze, verringere]
  );

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
    },
    produktOben: {
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
    mehrAnzeigenText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
      fontWeight: "600" as const,
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
    mengeBereich: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 10,
      gap: 12,
    },
    mengeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    mengeButtonDisabled: {
      backgroundColor: colors.border,
    },
    mengeButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 22,
    },
    mengeZahl: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      minWidth: 24,
      textAlign: "center",
    },
    warenkorbBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      paddingBottom: 24,
    },
    warenkorbBarText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    warenkorbBarPreis: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    ladeContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    galerieBereich: {
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    galerieBild: {
      width: Dimensions.get("window").width * 0.7,
      height: 180,
      borderRadius: 12,
    },
    keinProduktText: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      padding: 20,
    },
    bewertungZusammenfassung: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      gap: 10,
    },
    bewertungSterneReihe: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    bewertungStern: {
      fontSize: 20,
      color: colors.warning,
    },
    bewertungDurchschnitt: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.foreground,
      marginLeft: 4,
    },
    bewertungAnzahl: {
      fontSize: 13,
      color: colors.muted,
    },
    bewertungKarte: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 10,
      gap: 4,
    },
    bewertungKarteSterneReihe: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 3,
    },
    bewertungDatum: {
      fontSize: 11,
      color: colors.muted,
      marginLeft: 6,
    },
    bewertungKommentar: {
      fontSize: 13,
      color: colors.foreground,
      lineHeight: 18,
    },
    vollbildOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.95)",
      justifyContent: "center",
      alignItems: "center",
    },
    vollbildSchliessen: {
      position: "absolute",
      top: 50,
      right: 20,
      zIndex: 10,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    vollbildSchliessenText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    vollbildSeite: {
      width: Dimensions.get("window").width,
      height: Dimensions.get("window").height,
      justifyContent: "center",
      alignItems: "center",
    },
    vollbildBild: {
      width: Dimensions.get("window").width,
      height: Dimensions.get("window").height * 0.8,
    },
    vollbildZaehler: {
      position: "absolute",
      bottom: 50,
      color: "rgba(255,255,255,0.7)",
      fontSize: 14,
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
  // Kategorien direkt aus den Produkten ableiten (nicht aus kategorien-Array,
  // da dieses manchmal unvollständig ist). Reihenfolge: zuerst bekannte Kategorien
  // in definierter Reihenfolge, dann unbekannte alphabetisch.
  const KATEGORIE_REIHENFOLGE: Kategorie[] = ["eier", "gefluegel", "pilze", "imkerei", "garten", "holz"];
  const alleProdukteKategorien = Array.from(
    new Set((produkteAntwort?.produkte ?? []).map((p) => p.kategorie))
  );
  const kategorieReihenfolge: Kategorie[] = [
    ...KATEGORIE_REIHENFOLGE.filter((k) => alleProdukteKategorien.includes(k)),
    ...alleProdukteKategorien.filter((k) => !KATEGORIE_REIHENFOLGE.includes(k as Kategorie)) as Kategorie[],
  ];
  const produkteNachKategorie: Record<string, HofProdukt[]> = {};
  for (const kat of kategorieReihenfolge) {
    const liste = (produkteAntwort?.produkte ?? []).filter((p) => p.kategorie === kat);
    if (liste.length > 0) produkteNachKategorie[kat] = liste;
  }

  // Prüft ob ein String ein Emoji enthält
  const hatEmoji = (text: string) => /\p{Emoji_Presentation}/u.test(text);

  const renderProdukt = (produkt: HofProdukt) => {
    const meta = KATEGORIE_MAP[produkt.kategorie];
    const verfuegbarColor = produkt.verfuegbar
      ? colors.success
      : produkt.vorbestellung
        ? colors.warning
        : colors.muted;
    const verfuegbarText = produkt.verfuegbar
      ? "Verfügbar"
      : produkt.vorbestellungDatum
        ? `ab ${produkt.vorbestellungDatum}`
        : produkt.vorbestellung
          ? "Vorbestellung"
          : "Nicht verfügbar";

    const beschreibungLang = (produkt.beschreibung?.length ?? 0) > 80;
    const istAufgeklappt = aufgeklappteProdukte.has(produkt.id);
    const aktMenge = warenkorb?.positionen.find((p) => p.produkt.id === produkt.id)?.menge ?? 0;
    const kannBestellen = produkt.verfuegbar || produkt.vorbestellung;

    return (
      <View key={produkt.id} style={[styles.produktKarte, !kannBestellen && { opacity: 0.6 }]}>
        <Pressable
          style={styles.produktOben}
          onPress={beschreibungLang ? () => toggleProduktAufklappen(produkt.id) : undefined}
        >
          {!hatEmoji(produkt.name) && (
            <Text style={styles.produktEmoji}>{meta?.emoji ?? "🌿"}</Text>
          )}
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
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={[styles.verfuegbarBadge, { backgroundColor: verfuegbarColor + "20" }]}>
              <Text style={[styles.verfuegbarText, { color: verfuegbarColor }]}>
                {verfuegbarText}
              </Text>
            </View>
            {produkt.vorbestellung && !produkt.verfuegbar && (
              <View style={[styles.verfuegbarBadge, { backgroundColor: colors.warning + "20" }]}>
                <Text style={[styles.verfuegbarText, { color: colors.warning, fontSize: 10 }]}>
                  📦 Vorbestellung
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Mengenauswahl */}
        {kannBestellen && (
          <View style={styles.mengeBereich}>
            <Pressable
              style={({ pressed }) => [
                styles.mengeButton,
                aktMenge === 0 && styles.mengeButtonDisabled,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleMengeAendern(produkt, -1)}
              disabled={aktMenge === 0}
            >
              <Text style={styles.mengeButtonText}>−</Text>
            </Pressable>
            <Text style={styles.mengeZahl}>{aktMenge}</Text>
            <Pressable
              style={({ pressed }) => [styles.mengeButton, pressed && { opacity: 0.7 }]}
              onPress={() => handleMengeAendern(produkt, 1)}
            >
              <Text style={styles.mengeButtonText}>+</Text>
            </Pressable>
          </View>
        )}
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
        {hatWunschliste && (
          <Pressable
            style={({ pressed }) => [styles.favButton, { marginRight: 6 }, pressed && { opacity: 0.7 }]}
            onPress={toggleWunschliste}
          >
            <Text style={{ fontSize: 20 }}>{istAufWunschlisteState ? "❤️" : "🤍"}</Text>
          </Pressable>
        )}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: gesamtAnzahl > 0 ? 100 : 40 }}
      >
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

        {/* Bewertungs-Zusammenfassung */}
        {bewertungen && bewertungen.anzahl > 0 && (
          <View style={styles.bewertungZusammenfassung}>
            <View style={styles.bewertungSterneReihe}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={styles.bewertungStern}>
                  {s <= Math.round(bewertungen.durchschnitt) ? "★" : "☆"}
                </Text>
              ))}
              <Text style={styles.bewertungDurchschnitt}>
                {bewertungen.durchschnitt.toFixed(1)}
              </Text>
              <Text style={styles.bewertungAnzahl}>({bewertungen.anzahl} Bewertungen)</Text>
            </View>
            {bewertungen.bewertungen.slice(0, 3).map((bw) => (
              <View key={bw.id} style={styles.bewertungKarte}>
                <View style={styles.bewertungKarteSterneReihe}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Text key={s} style={{ fontSize: 12, color: s <= bw.sterne ? colors.warning : colors.border }}>
                      {s <= bw.sterne ? "★" : "☆"}
                    </Text>
                  ))}
                  <Text style={styles.bewertungDatum}>
                    {new Date(bw.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </Text>
                </View>
                {bw.kommentar && (
                  <Text style={styles.bewertungKommentar} numberOfLines={3}>
                    {bw.kommentar}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Hof-Bilder-Galerie */}
        {profil?.bilder && profil.bilder.length > 0 && (
          <View style={styles.galerieBereich}>
            <FlatList
              data={profil.bilder}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => `bild-${idx}`}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVollbildIndex(index);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.galerieBild}
                    resizeMode="cover"
                  />
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Vollbild-Modal */}
        {profil?.bilder && profil.bilder.length > 0 && (
          <Modal
            visible={vollbildIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => setVollbildIndex(null)}
            statusBarTranslucent
          >
            <View style={styles.vollbildOverlay}>
              <StatusBar hidden />
              <TouchableOpacity
                style={styles.vollbildSchliessen}
                onPress={() => setVollbildIndex(null)}
              >
                <Text style={styles.vollbildSchliessenText}>✕</Text>
              </TouchableOpacity>
              <FlatList
                ref={vollbildRef}
                data={profil.bilder}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, idx) => `vb-${idx}`}
                initialScrollIndex={vollbildIndex ?? 0}
                getItemLayout={(_, index) => ({
                  length: Dimensions.get("window").width,
                  offset: Dimensions.get("window").width * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <View style={styles.vollbildSeite}>
                    <Image
                      source={{ uri: item }}
                      style={styles.vollbildBild}
                      resizeMode="contain"
                    />
                  </View>
                )}
              />
              {profil.bilder.length > 1 && (
                <Text style={styles.vollbildZaehler}>
                  {(vollbildIndex ?? 0) + 1} / {profil.bilder.length}
                </Text>
              )}
            </View>
          </Modal>
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
      </ScrollView>

      {/* Warenkorb-Bar */}
      {gesamtAnzahl > 0 && (
        <Pressable
          style={({ pressed }) => [styles.warenkorbBar, pressed && { opacity: 0.9 }]}
          onPress={handleWarenkorbOeffnen}
        >
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={styles.warenkorbBarText}>{gesamtAnzahl}</Text>
          </View>
          <Text style={styles.warenkorbBarText}>Warenkorb ansehen</Text>
          <Text style={styles.warenkorbBarPreis}>
            {gesamtpreis.toFixed(2).replace(".", ",")} €
          </Text>
        </Pressable>
      )}
    </ScreenContainer>
  );
}
