/**
 * LocaBuy – Profil bearbeiten
 * Nutzer können Name, E-Mail, Adresse, Profilbild und Push-Einstellungen ändern.
 */

import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  ladeNutzerProfil,
  speichereNutzerProfil,
  type NutzerProfil,
} from "@/lib/nutzer-store";
import { createTRPCClient } from "@/lib/trpc";

export default function ProfilBearbeitenScreen() {
  const colors = useColors();
  const s = styles(colors);

  const [profil, setProfil] = useState<NutzerProfil | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [pushBenachrichtigungen, setPushBenachrichtigungen] = useState(true);
  const [profilbildUri, setProfilbildUri] = useState<string | null>(null); // lokale Vorschau
  const [profilbildUrl, setProfilbildUrl] = useState<string | null>(null); // S3-URL
  const [bildLaedt, setBildLaedt] = useState(false);
  const [laden, setLaden] = useState(false);
  const [speichernLaedt, setSpeichernLaedt] = useState(false);

  useEffect(() => {
    (async () => {
      setLaden(true);
      const p = await ladeNutzerProfil();
      if (!p) {
        router.back();
        return;
      }
      setProfil(p);
      setName(p.name ?? "");
      setEmail(p.email ?? "");
      setStrasse(p.strasse ?? "");
      setPlz(p.plz ?? "");
      setOrt(p.ort ?? "");
      setPushBenachrichtigungen(p.pushBenachrichtigungen !== false);
      setProfilbildUrl(p.profilbildUrl ?? null);
      setLaden(false);
    })();
  }, []);

  // ── Profilbild auswählen ──────────────────────────────────────────────────

  const bildAuswaehlen = useCallback(async (quelle: "galerie" | "kamera") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let result: ImagePicker.ImagePickerResult;

    if (quelle === "kamera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Kein Zugriff", "Bitte erlaube den Kamera-Zugriff in den Einstellungen.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
    }

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setProfilbildUri(asset.uri);

    if (!asset.base64 || !profil) return;

    setBildLaedt(true);
    try {
      const client = createTRPCClient();
      const mimeType = asset.mimeType ?? "image/jpeg";
      const antwort = await (client as any).nutzer.profilbildHochladen.mutate({
        nutzerId: profil.id,
        bildBase64: asset.base64,
        mimeType,
      });
      setProfilbildUrl(antwort.url);
      // Lokal sofort speichern
      const aktuell = await ladeNutzerProfil();
      if (aktuell) {
        await speichereNutzerProfil({ ...aktuell, profilbildUrl: antwort.url });
      }
    } catch (err: any) {
      Alert.alert("Upload fehlgeschlagen", err?.message ?? "Bitte erneut versuchen.");
      setProfilbildUri(null);
    } finally {
      setBildLaedt(false);
    }
  }, [profil]);

  const bildAuswaehlenDialog = useCallback(() => {
    if (Platform.OS === "web") {
      bildAuswaehlen("galerie");
      return;
    }
    Alert.alert("Profilbild ändern", "Woher soll das Bild kommen?", [
      { text: "Kamera", onPress: () => bildAuswaehlen("kamera") },
      { text: "Galerie", onPress: () => bildAuswaehlen("galerie") },
      { text: "Abbrechen", style: "cancel" },
    ]);
  }, [bildAuswaehlen]);

  // ── Profil speichern ──────────────────────────────────────────────────────

  const handleSpeichern = useCallback(async () => {
    if (!profil) return;
    const nameTrimmed = name.trim();
    if (nameTrimmed.length < 2) {
      Alert.alert("Ungültiger Name", "Bitte gib mindestens 2 Zeichen ein.");
      return;
    }
    const emailTrimmed = email.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      Alert.alert("Ungültige E-Mail", "Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    setSpeichernLaedt(true);
    try {
      const client = createTRPCClient();
      const aktuell = await (client as any).nutzer.profilAktualisieren.mutate({
        id: profil.id,
        name: nameTrimmed,
        email: emailTrimmed || null,
        strasse: strasse.trim() || null,
        plz: plz.trim() || null,
        ort: ort.trim() || null,
        pushBenachrichtigungen,
      });

      await speichereNutzerProfil({
        ...profil,
        name: aktuell.name,
        email: aktuell.email ?? null,
        strasse: aktuell.strasse ?? null,
        plz: aktuell.plz ?? null,
        ort: aktuell.ort ?? null,
        profilbildUrl: aktuell.profilbildUrl ?? profilbildUrl,
        pushBenachrichtigungen: aktuell.pushBenachrichtigungen,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Gespeichert", "Dein Profil wurde erfolgreich aktualisiert.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Fehler", err?.message ?? "Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSpeichernLaedt(false);
    }
  }, [profil, name, email, strasse, plz, ort, pushBenachrichtigungen, profilbildUrl]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (laden) {
    return (
      <ScreenContainer>
        <View style={s.ladeContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  const avatarQuelle = profilbildUri ?? profilbildUrl;
  const initialen = profil?.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable
            style={({ pressed }) => [s.zurueckBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <Text style={s.zurueckText}>‹ Zurück</Text>
          </Pressable>
          <Text style={s.titel}>Profil bearbeiten</Text>
          <View style={{ width: 72 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profilbild */}
          <View style={s.avatarBereich}>
            <Pressable
              style={({ pressed }) => [s.avatarWrapper, pressed && { opacity: 0.8 }]}
              onPress={bildAuswaehlenDialog}
              disabled={bildLaedt}
            >
              {avatarQuelle ? (
                <Image source={{ uri: avatarQuelle }} style={s.avatarBild} />
              ) : (
                <View style={s.avatarPlatzhalter}>
                  <Text style={s.avatarInitialen}>{initialen}</Text>
                </View>
              )}
              {bildLaedt ? (
                <View style={s.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : (
                <View style={s.avatarKameraIcon}>
                  <Text style={s.avatarKameraText}>📷</Text>
                </View>
              )}
            </Pressable>
            <Text style={s.avatarHinweis}>Tippe zum Ändern</Text>
          </View>

          {/* Kontakt */}
          <View style={s.sektion}>
            <Text style={s.sektionTitel}>Kontakt</Text>
            <View style={s.karte}>
              <View style={s.feldContainer}>
                <Text style={s.feldLabel}>Telefonnummer</Text>
                <Text style={s.telefonText}>{profil?.telefon ?? "–"}</Text>
                <Text style={s.telefonHinweis}>Die Telefonnummer kann nicht geändert werden.</Text>
              </View>
              <View style={s.trennlinie} />
              <View style={s.feldContainer}>
                <Text style={s.feldLabel}>E-Mail (optional)</Text>
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="deine@email.de"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>

          {/* Name */}
          <View style={s.sektion}>
            <Text style={s.sektionTitel}>Persönliche Daten</Text>
            <View style={s.karte}>
              <View style={s.feldContainer}>
                <Text style={s.feldLabel}>Vor- und Nachname *</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Max Mustermann"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>

          {/* Adresse */}
          <View style={s.sektion}>
            <Text style={s.sektionTitel}>Adresse (optional)</Text>
            <View style={s.karte}>
              <View style={s.feldContainer}>
                <Text style={s.feldLabel}>Straße und Hausnummer</Text>
                <TextInput
                  style={s.input}
                  value={strasse}
                  onChangeText={setStrasse}
                  placeholder="Musterstraße 1"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={s.trennlinie} />
              <View style={s.zweispaltig}>
                <View style={[s.feldContainer, { flex: 1, marginRight: 8 }]}>
                  <Text style={s.feldLabel}>PLZ</Text>
                  <TextInput
                    style={s.input}
                    value={plz}
                    onChangeText={setPlz}
                    placeholder="12345"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={5}
                    returnKeyType="next"
                  />
                </View>
                <View style={[s.feldContainer, { flex: 2 }]}>
                  <Text style={s.feldLabel}>Ort</Text>
                  <TextInput
                    style={s.input}
                    value={ort}
                    onChangeText={setOrt}
                    placeholder="Musterstadt"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleSpeichern}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Benachrichtigungen */}
          <View style={s.sektion}>
            <Text style={s.sektionTitel}>Benachrichtigungen</Text>
            <View style={s.karte}>
              <View style={s.toggleZeile}>
                <View style={{ flex: 1 }}>
                  <Text style={s.toggleTitel}>Push-Benachrichtigungen</Text>
                  <Text style={s.toggleHinweis}>
                    Erhalte Status-Updates zu deinen Bestellungen (z.B. „Bestellung bereit zur Abholung").
                  </Text>
                </View>
                <Switch
                  value={pushBenachrichtigungen}
                  onValueChange={(val) => {
                    setPushBenachrichtigungen(val);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>

          {/* Speichern */}
          <View style={s.sektion}>
            <Pressable
              style={({ pressed }) => [
                s.speichernBtn,
                pressed && { opacity: 0.85 },
                speichernLaedt && { opacity: 0.7 },
              ]}
              onPress={handleSpeichern}
              disabled={speichernLaedt}
            >
              {speichernLaedt ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.speichernText}>Änderungen speichern</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    ladeContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    zurueckBtn: { paddingVertical: 4, paddingRight: 8, minWidth: 72 },
    zurueckText: { fontSize: 16, color: colors.primary },
    titel: { fontSize: 17, fontWeight: "700", color: colors.foreground },
    scrollContent: { paddingBottom: 40 },
    // Avatar
    avatarBereich: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
    avatarWrapper: { position: "relative" },
    avatarBild: { width: 96, height: 96, borderRadius: 48 },
    avatarPlatzhalter: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitialen: { fontSize: 36, fontWeight: "700", color: "#fff" },
    avatarOverlay: {
      position: "absolute",
      inset: 0,
      borderRadius: 48,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarKameraIcon: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarKameraText: { fontSize: 14 },
    avatarHinweis: { fontSize: 12, color: colors.muted, marginTop: 8 },
    // Sektionen
    sektion: { marginTop: 24, marginHorizontal: 16 },
    sektionTitel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 8,
      marginLeft: 4,
    },
    karte: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    feldContainer: { paddingHorizontal: 16, paddingVertical: 12 },
    feldLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    input: { fontSize: 16, color: colors.foreground, paddingVertical: 0, minHeight: 28 },
    telefonText: { fontSize: 16, color: colors.foreground, marginBottom: 4 },
    telefonHinweis: { fontSize: 12, color: colors.muted, lineHeight: 16 },
    trennlinie: { height: 0.5, backgroundColor: colors.border, marginLeft: 16 },
    zweispaltig: { flexDirection: "row" },
    // Toggle
    toggleZeile: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    toggleTitel: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 2 },
    toggleHinweis: { fontSize: 12, color: colors.muted, lineHeight: 16 },
    // Speichern
    speichernBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    speichernText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
