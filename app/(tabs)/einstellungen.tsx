import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc";

const FAVORITEN_KEY = "gartengluck_favoriten";
const STORAGE_PLZ_KEY = "gartengluck_letzte_plz";

type AdminNutzer = {
  id: number;
  telefon: string;
  name: string;
  strasse: string | null;
  ort: string | null;
  plz: string | null;
  gesperrt: boolean;
  sperrGrund: string | null;
  erstelltAm: string | null;
};

export default function EinstellungenScreen() {
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [gespeichertePlz, setGespeichertePlz] = useState<string | null>(null);
  const [favoritenAnzahl, setFavoritenAnzahl] = useState(0);
  const isDark = colorScheme === "dark";

  // Admin-Bereich
  const [adminModalOffen, setAdminModalOffen] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [adminFreigeschaltet, setAdminFreigeschaltet] = useState(false);
  const [adminPinFehler, setAdminPinFehler] = useState(false);
  const [nutzerListe, setNutzerListe] = useState<AdminNutzer[]>([]);
  const [sperrModalOffen, setSperrModalOffen] = useState(false);
  const [zuSperrenNutzer, setZuSperrenNutzer] = useState<AdminNutzer | null>(null);
  const [sperrGrund, setSperrGrund] = useState("");

  const alleNutzerQuery = trpc.nutzer.alleNutzer.useQuery(
    { adminPin },
    { enabled: false }
  );
  const sperrenMutation = trpc.nutzer.sperren.useMutation();
  const entsperrenMutation = trpc.nutzer.entsperren.useMutation();

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

  const handleAdminPinEingabe = useCallback(async () => {
    if (adminPin.length < 4) {
      setAdminPinFehler(true);
      return;
    }
    try {
      const ergebnis = await alleNutzerQuery.refetch();
      if (ergebnis.data) {
        setNutzerListe(ergebnis.data as AdminNutzer[]);
        setAdminFreigeschaltet(true);
        setAdminPinFehler(false);
      }
    } catch {
      setAdminPinFehler(true);
    }
  }, [adminPin, alleNutzerQuery]);

  const handleSperren = useCallback((nutzer: AdminNutzer) => {
    setZuSperrenNutzer(nutzer);
    setSperrGrund("");
    setSperrModalOffen(true);
  }, []);

  const handleSperrenBestaetigen = useCallback(async () => {
    if (!zuSperrenNutzer || sperrGrund.trim().length < 3) return;
    await sperrenMutation.mutateAsync({ id: zuSperrenNutzer.id, grund: sperrGrund.trim() });
    setNutzerListe((prev) =>
      prev.map((n) =>
        n.id === zuSperrenNutzer.id ? { ...n, gesperrt: true, sperrGrund: sperrGrund.trim() } : n
      )
    );
    setSperrModalOffen(false);
    setZuSperrenNutzer(null);
  }, [zuSperrenNutzer, sperrGrund, sperrenMutation]);

  const handleEntsprerren = useCallback(async (nutzer: AdminNutzer) => {
    Alert.alert("Entsperren", `${nutzer.name} entsperren?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Entsperren",
        onPress: async () => {
          await entsperrenMutation.mutateAsync({ id: nutzer.id });
          setNutzerListe((prev) =>
            prev.map((n) =>
              n.id === nutzer.id ? { ...n, gesperrt: false, sperrGrund: null } : n
            )
          );
        },
      },
    ]);
  }, [entsperrenMutation]);

  const s = styles(colors);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const renderNutzer = ({ item }: { item: AdminNutzer }) => (
    <View style={[s.nutzerZeile, item.gesperrt && s.nutzerGesperrt]}>
      <View style={s.nutzerInfo}>
        <Text style={s.nutzerName} numberOfLines={1}>
          {item.gesperrt ? "🚫 " : "✅ "}{item.name}
        </Text>
        <Text style={s.nutzerTelefon}>{item.telefon}</Text>
        {item.plz && item.ort && (
          <Text style={s.nutzerOrt}>{item.plz} {item.ort}</Text>
        )}
        {item.gesperrt && item.sperrGrund && (
          <Text style={s.sperrGrundText}>Grund: {item.sperrGrund}</Text>
        )}
        {item.erstelltAm && (
          <Text style={s.erstelltAmText}>
            Registriert: {new Date(item.erstelltAm).toLocaleDateString("de-DE")}
          </Text>
        )}
      </View>
      <Pressable
        style={({ pressed }) => [
          s.sperrButton,
          item.gesperrt ? s.entsperrButton : s.sperrButtonRot,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => item.gesperrt ? handleEntsprerren(item) : handleSperren(item)}
      >
        <Text style={[s.sperrButtonText, item.gesperrt && s.entsperrButtonText]}>
          {item.gesperrt ? "Entsperren" : "Sperren"}
        </Text>
      </Pressable>
    </View>
  );

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

        {/* Admin */}
        <View style={s.sektion}>
          <Text style={s.sektionTitel}>Administration</Text>
          <View style={s.sektionKarte}>
            <Pressable
              style={({ pressed }) => [s.zeile, pressed && { opacity: 0.7 }]}
              onPress={() => { setAdminModalOffen(true); setAdminFreigeschaltet(false); setAdminPin(""); }}
            >
              <Text style={s.zeileTitel}>🔐 Nutzer verwalten</Text>
              <Text style={s.zeileWert}>›</Text>
            </Pressable>
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
          </View>
        </View>

        <Text style={s.versionText}>Gartenglück v{version}</Text>
      </ScrollView>

      {/* Admin-Modal */}
      <Modal
        visible={adminModalOffen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAdminModalOffen(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitel}>
              {adminFreigeschaltet ? `Nutzer (${nutzerListe.length})` : "Admin-Zugang"}
            </Text>
            <Pressable
              style={({ pressed }) => [s.schliessenButton, pressed && { opacity: 0.7 }]}
              onPress={() => setAdminModalOffen(false)}
            >
              <Text style={s.schliessenText}>Schließen</Text>
            </Pressable>
          </View>

          {!adminFreigeschaltet ? (
            <View style={s.pinBereich}>
              <Text style={s.pinHinweis}>Bitte Admin-PIN eingeben:</Text>
              <TextInput
                style={[s.pinInput, adminPinFehler && s.pinInputFehler]}
                value={adminPin}
                onChangeText={(t) => { setAdminPin(t); setAdminPinFehler(false); }}
                placeholder="PIN"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                secureTextEntry
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleAdminPinEingabe}
              />
              {adminPinFehler && (
                <Text style={s.pinFehlerText}>Falscher PIN oder Verbindungsfehler.</Text>
              )}
              <Pressable
                style={({ pressed }) => [s.pinButton, pressed && { opacity: 0.85 }]}
                onPress={handleAdminPinEingabe}
                disabled={alleNutzerQuery.isFetching}
              >
                {alleNutzerQuery.isFetching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.pinButtonText}>Anmelden</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={nutzerListe}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderNutzer}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <Text style={s.leerText}>Noch keine registrierten Nutzer.</Text>
              }
            />
          )}
        </View>
      </Modal>

      {/* Sperr-Grund-Modal */}
      <Modal
        visible={sperrModalOffen}
        animationType="fade"
        transparent
        onRequestClose={() => setSperrModalOffen(false)}
      >
        <View style={s.overlayContainer}>
          <View style={s.sperrModalInhalt}>
            <Text style={s.sperrModalTitel}>Nutzer sperren</Text>
            <Text style={s.sperrModalName}>{zuSperrenNutzer?.name}</Text>
            <Text style={s.sperrGrundLabel}>Sperrgrund (Pflicht):</Text>
            <TextInput
              style={s.sperrGrundInput}
              value={sperrGrund}
              onChangeText={setSperrGrund}
              placeholder="z.B. Missbrauch, Spam..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
            <View style={s.sperrModalButtons}>
              <Pressable
                style={({ pressed }) => [s.sperrModalAbbrechen, pressed && { opacity: 0.7 }]}
                onPress={() => setSperrModalOffen(false)}
              >
                <Text style={s.sperrModalAbbrechenText}>Abbrechen</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.sperrModalBestaetigen,
                  pressed && { opacity: 0.85 },
                  sperrGrund.trim().length < 3 && s.buttonDisabled,
                ]}
                onPress={handleSperrenBestaetigen}
                disabled={sperrGrund.trim().length < 3 || sperrenMutation.isPending}
              >
                {sperrenMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.sperrModalBestaetigungText}>Jetzt sperren</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    // Admin Modal
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
      borderBottomWidth: 0.5, borderBottomColor: colors.border,
    },
    modalTitel: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    schliessenButton: { paddingHorizontal: 12, paddingVertical: 6 },
    schliessenText: { fontSize: 15, color: colors.primary },
    pinBereich: { padding: 24, gap: 12 },
    pinHinweis: { fontSize: 15, color: colors.foreground, marginBottom: 4 },
    pinInput: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 20, color: colors.foreground, textAlign: "center", letterSpacing: 8,
    },
    pinInputFehler: { borderColor: colors.error },
    pinFehlerText: { color: colors.error, fontSize: 13 },
    pinButton: {
      backgroundColor: colors.primary, borderRadius: 12,
      paddingVertical: 14, alignItems: "center", marginTop: 8,
    },
    pinButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    // Nutzer-Liste
    nutzerZeile: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, marginBottom: 10,
      flexDirection: "row", alignItems: "flex-start",
    },
    nutzerGesperrt: { borderColor: colors.error + "60", backgroundColor: colors.error + "08" },
    nutzerInfo: { flex: 1 },
    nutzerName: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginBottom: 2 },
    nutzerTelefon: { fontSize: 13, color: colors.muted, marginBottom: 2 },
    nutzerOrt: { fontSize: 13, color: colors.muted, marginBottom: 2 },
    sperrGrundText: { fontSize: 12, color: colors.error, marginTop: 2 },
    erstelltAmText: { fontSize: 11, color: colors.muted, marginTop: 2 },
    sperrButton: {
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
      marginLeft: 10, alignSelf: "flex-start",
    },
    sperrButtonRot: { backgroundColor: colors.error + "15" },
    entsperrButton: { backgroundColor: colors.success + "15" },
    sperrButtonText: { fontSize: 13, fontWeight: "600", color: colors.error },
    entsperrButtonText: { color: colors.success },
    leerText: { textAlign: "center", color: colors.muted, fontSize: 14, marginTop: 32 },
    // Sperr-Grund-Modal
    overlayContainer: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center", alignItems: "center", padding: 24,
    },
    sperrModalInhalt: {
      backgroundColor: colors.background, borderRadius: 20,
      padding: 24, width: "100%", maxWidth: 400,
    },
    sperrModalTitel: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 },
    sperrModalName: { fontSize: 15, color: colors.muted, marginBottom: 16 },
    sperrGrundLabel: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
    sperrGrundInput: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: colors.foreground, minHeight: 80, textAlignVertical: "top",
    },
    sperrModalButtons: { flexDirection: "row", gap: 12, marginTop: 16 },
    sperrModalAbbrechen: {
      flex: 1, paddingVertical: 12, borderRadius: 10,
      backgroundColor: colors.surface, alignItems: "center",
    },
    sperrModalAbbrechenText: { fontSize: 15, color: colors.muted, fontWeight: "600" },
    sperrModalBestaetigen: {
      flex: 1, paddingVertical: 12, borderRadius: 10,
      backgroundColor: colors.error, alignItems: "center",
    },
    buttonDisabled: { opacity: 0.5 },
    sperrModalBestaetigungText: { fontSize: 15, color: "#fff", fontWeight: "700" },
  });
