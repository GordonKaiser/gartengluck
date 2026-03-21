/**
 * LocaBuy – Profil bearbeiten
 * Nutzer können Name, E-Mail und Adresse nachträglich ändern.
 */

import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

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
  const [laden, setLaden] = useState(false);
  const [speichern, setSpeichern] = useState(false);

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
      setLaden(false);
    })();
  }, []);

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

    setSpeichern(true);
    try {
      const client = createTRPCClient();
      const aktuell = await (client as any).nutzer.profilAktualisieren.mutate({
        id: profil.id,
        name: nameTrimmed,
        email: emailTrimmed || null,
        strasse: strasse.trim() || null,
        plz: plz.trim() || null,
        ort: ort.trim() || null,
      });

      // Lokal speichern
      await speichereNutzerProfil({
        ...profil,
        name: aktuell.name,
        email: aktuell.email ?? null,
        strasse: aktuell.strasse ?? null,
        plz: aktuell.plz ?? null,
        ort: aktuell.ort ?? null,
      });

      Alert.alert("Gespeichert", "Dein Profil wurde erfolgreich aktualisiert.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Fehler", err?.message ?? "Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setSpeichern(false);
    }
  }, [profil, name, email, strasse, plz, ort]);

  if (laden) {
    return (
      <ScreenContainer>
        <View style={s.ladeContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

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
          {/* Telefon (nicht änderbar) */}
          <View style={s.sektion}>
            <Text style={s.sektionTitel}>Kontakt</Text>
            <View style={s.karte}>
              <View style={s.feldContainer}>
                <Text style={s.feldLabel}>Telefonnummer</Text>
                <Text style={s.telefonText}>{profil?.telefon ?? "–"}</Text>
                <Text style={s.telefonHinweis}>
                  Die Telefonnummer kann nicht geändert werden.
                </Text>
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

          {/* Speichern-Button */}
          <View style={s.sektion}>
            <Pressable
              style={({ pressed }) => [
                s.speichernBtn,
                pressed && { opacity: 0.85 },
                speichern && { opacity: 0.7 },
              ]}
              onPress={handleSpeichern}
              disabled={speichern}
            >
              {speichern ? (
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
    ladeContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
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
    input: {
      fontSize: 16,
      color: colors.foreground,
      paddingVertical: 0,
      minHeight: 28,
    },
    telefonText: { fontSize: 16, color: colors.foreground, marginBottom: 4 },
    telefonHinweis: { fontSize: 12, color: colors.muted, lineHeight: 16 },
    trennlinie: { height: 0.5, backgroundColor: colors.border, marginLeft: 16 },
    zweispaltig: { flexDirection: "row", paddingTop: 0 },
    speichernBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    speichernText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  });
