import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  type HofSucheErgebnis,
  type Kategorie,
  KATEGORIEN,
  KATEGORIE_MAP,
  plzLookup,
  suchHoefe,
} from "@/lib/hofmarkt-api";

const STORAGE_PLZ_KEY = "gartengluck_letzte_plz";
const STORAGE_RADIUS_KEY = "gartengluck_letzter_radius";

const RADIUS_OPTIONEN = [10, 25, 50] as const;
type RadiusOption = (typeof RADIUS_OPTIONEN)[number];

export default function EntdeckenScreen() {
  const colors = useColors();
  const [plz, setPlz] = useState("");
  const [ortName, setOrtName] = useState<string | null>(null);
  const [radius, setRadius] = useState<RadiusOption>(25);
  const [aktiveKategorien, setAktiveKategorien] = useState<Kategorie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoefen, setHoefen] = useState<HofSucheErgebnis[]>([]);
  const [gesucht, setGesucht] = useState(false);
  const [sucheOrt, setSucheOrt] = useState("");
  const inputRef = useRef<TextInput>(null);
  const plzLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Letzte Suche aus AsyncStorage laden
  useEffect(() => {
    (async () => {
      const gespeichertePlz = await AsyncStorage.getItem(STORAGE_PLZ_KEY);
      const gespeicherterRadius = await AsyncStorage.getItem(STORAGE_RADIUS_KEY);
      if (gespeichertePlz) setPlz(gespeichertePlz);
      if (gespeicherterRadius) setRadius(parseInt(gespeicherterRadius) as RadiusOption);
    })();
  }, []);

  // PLZ-Lookup mit Debounce (500ms)
  useEffect(() => {
    if (plzLookupTimer.current) clearTimeout(plzLookupTimer.current);
    if (plz.length === 5) {
      plzLookupTimer.current = setTimeout(async () => {
        const ergebnis = await plzLookup(plz);
        setOrtName(ergebnis?.ort ?? null);
      }, 500);
    } else {
      setOrtName(null);
    }
    return () => {
      if (plzLookupTimer.current) clearTimeout(plzLookupTimer.current);
    };
  }, [plz]);

  const toggleKategorie = useCallback((kat: Kategorie) => {
    setAktiveKategorien((prev) =>
      prev.includes(kat) ? prev.filter((k) => k !== kat) : [...prev, kat]
    );
  }, []);

  const handleSuche = useCallback(async () => {
    if (plz.trim().length < 4) return;
    Keyboard.dismiss();
    await AsyncStorage.setItem(STORAGE_PLZ_KEY, plz.trim());
    await AsyncStorage.setItem(STORAGE_RADIUS_KEY, String(radius));
    setIsLoading(true);
    setError(null);
    setGesucht(true);
    setSucheOrt(ortName ?? plz.trim());
    try {
      const ergebnisse = await suchHoefe(
        plz.trim(),
        radius,
        aktiveKategorien.length > 0 ? aktiveKategorien : undefined
      );
      setHoefen(ergebnisse);
    } catch (err: any) {
      setError(err.message ?? "Suche fehlgeschlagen");
      setHoefen([]);
    } finally {
      setIsLoading(false);
    }
  }, [plz, radius, aktiveKategorien, ortName]);

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    titel: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    untertitel: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 16,
    },
    suchbereich: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    eingabeContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 48,
      gap: 8,
    },
    eingabe: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
      height: 48,
    },
    ortHinweis: {
      fontSize: 12,
      color: colors.primary,
      marginTop: -8,
      marginBottom: 10,
      marginLeft: 4,
    },
    sucheButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    radiusContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 12,
    },
    radiusChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    radiusChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    filterLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    kategorieChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
      marginBottom: 8,
    },
    kategorieChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    ergebnisHeader: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    ergebnisText: {
      fontSize: 13,
      color: colors.muted,
    },
    hofKarte: {
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    hofKarteHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    hofName: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
      marginRight: 8,
    },
    distanzBadge: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    distanzText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    hofOrt: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 10,
    },
    kategorienContainer: {
      flexDirection: "row",
      gap: 6,
      flexWrap: "wrap",
    },
    kategorienBadge: {
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    kategorienBadgeText: {
      fontSize: 12,
    },
    leerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: 60,
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
    },
  });

  const renderHofKarte = ({ item }: { item: HofSucheErgebnis }) => {
    // Kategorien aus dem Suchergebnis (wenn Filter aktiv) oder leer
    const kategorien = item.produkte ?? [];

    return (
      <Pressable
        style={({ pressed }) => [styles.hofKarte, pressed && { opacity: 0.75 }]}
        onPress={() =>
          router.push({
            pathname: "/hof/[id]" as any,
            params: {
              id: String(item.userId),
              userId: String(item.userId),
              hofName: item.hofName,
            },
          })
        }
      >
        <View style={styles.hofKarteHeader}>
          <Text style={styles.hofName} numberOfLines={1}>
            {item.hofName}
          </Text>
          <View style={styles.distanzBadge}>
            <Text style={styles.distanzText}>
              {item.distanzKm < 1
                ? `${Math.round(item.distanzKm * 1000)} m`
                : `${item.distanzKm.toFixed(1)} km`}
            </Text>
          </View>
        </View>
        <Text style={styles.hofOrt}>
          📍 {item.ort}{item.plz ? ` · ${item.plz}` : ""}
        </Text>
        {kategorien.length > 0 && (
          <View style={styles.kategorienContainer}>
            {kategorien.map((kat) => {
              const meta = KATEGORIE_MAP[kat];
              return (
                <View key={kat} style={styles.kategorienBadge}>
                  <Text style={styles.kategorienBadgeText}>{meta?.emoji ?? "🌿"}</Text>
                  <Text style={[styles.kategorienBadgeText, { color: colors.muted }]}>
                    {meta?.label ?? kat}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Pressable>
    );
  };

  const ListHeader = (
    <View style={styles.header}>
      <Text style={styles.titel}>Gartenglück</Text>
      <Text style={styles.untertitel}>Produkte aus Hobby-Anbau & -Haltung</Text>

      {/* PLZ-Eingabe + Suche-Button */}
      <View style={styles.suchbereich}>
        <View style={styles.eingabeContainer}>
          <IconSymbol name="location.fill" size={18} color={colors.muted} />
          <TextInput
            ref={inputRef}
            style={styles.eingabe}
            placeholder="PLZ eingeben"
            placeholderTextColor={colors.muted}
            value={plz}
            onChangeText={setPlz}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="search"
            onSubmitEditing={handleSuche}
          />
          {plz.length > 0 && (
            <Pressable
              onPress={() => {
                setPlz("");
                setOrtName(null);
                setGesucht(false);
                setHoefen([]);
              }}
            >
              <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [styles.sucheButton, pressed && { opacity: 0.8 }]}
          onPress={handleSuche}
        >
          <IconSymbol name="magnifyingglass" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Ortsname-Hinweis */}
      {ortName && (
        <Text style={styles.ortHinweis}>📍 {ortName}</Text>
      )}

      {/* Radius-Auswahl */}
      <View style={styles.radiusContainer}>
        {RADIUS_OPTIONEN.map((r) => (
          <Pressable
            key={r}
            style={[
              styles.radiusChip,
              {
                backgroundColor: radius === r ? colors.primary : colors.surface,
                borderColor: radius === r ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setRadius(r)}
          >
            <Text
              style={[
                styles.radiusChipText,
                { color: radius === r ? "#fff" : colors.muted },
              ]}
            >
              {r} km
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Kategorie-Filter */}
      <Text style={styles.filterLabel}>Produkt-Filter</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", flexWrap: "nowrap" }}>
          {KATEGORIEN.map((kat) => {
            const aktiv = aktiveKategorien.includes(kat.id);
            return (
              <Pressable
                key={kat.id}
                style={[
                  styles.kategorieChip,
                  {
                    backgroundColor: aktiv ? colors.primary : colors.surface,
                    borderColor: aktiv ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleKategorie(kat.id)}
              >
                <Text style={styles.kategorienBadgeText}>{kat.emoji}</Text>
                <Text
                  style={[
                    styles.kategorieChipText,
                    { color: aktiv ? "#fff" : colors.muted },
                  ]}
                >
                  {kat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1">
        {ListHeader}
        <View style={styles.leerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.leerText, { marginTop: 16 }]}>Höfe werden gesucht…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="flex-1">
        {ListHeader}
        <View style={styles.leerContainer}>
          <Text style={styles.leerEmoji}>⚠️</Text>
          <Text style={styles.leerTitel}>Fehler bei der Suche</Text>
          <Text style={styles.leerText}>{error}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (gesucht && hoefen.length === 0) {
    return (
      <ScreenContainer className="flex-1">
        {ListHeader}
        <View style={styles.leerContainer}>
          <Text style={styles.leerEmoji}>🌾</Text>
          <Text style={styles.leerTitel}>Keine Höfe gefunden</Text>
          <Text style={styles.leerText}>
            Im Umkreis von {radius} km um {sucheOrt} wurden keine Höfe gefunden.
            {aktiveKategorien.length > 0
              ? " Versuche weniger Filter oder einen größeren Suchradius."
              : " Versuche einen größeren Suchradius."}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (gesucht && hoefen.length > 0) {
    return (
      <ScreenContainer className="flex-1">
        <FlatList
          data={hoefen}
          keyExtractor={(item) => String(item.userId)}
          renderItem={renderHofKarte}
          ListHeaderComponent={
            <>
              {ListHeader}
              <View style={styles.ergebnisHeader}>
                <Text style={styles.ergebnisText}>
                  {hoefen.length} {hoefen.length === 1 ? "Hof" : "Höfe"} in der Nähe von{" "}
                  {sucheOrt}
                  {aktiveKategorien.length > 0
                    ? ` · Filter: ${aktiveKategorien.map((k) => KATEGORIE_MAP[k]?.label).join(", ")}`
                    : ""}
                </Text>
              </View>
            </>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      {ListHeader}
      <View style={styles.leerContainer}>
        <Text style={styles.leerEmoji}>🏡</Text>
        <Text style={styles.leerTitel}>Höfe in deiner Nähe finden</Text>
        <Text style={styles.leerText}>
          Gib deine Postleitzahl ein und wähle einen Suchradius, um Höfe mit frischen Produkten
          in deiner Umgebung zu entdecken.
        </Text>
      </View>
    </ScreenContainer>
  );
}
