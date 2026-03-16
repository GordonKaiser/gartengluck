/**
 * Gartenglück – Onboarding-Screen
 * Wird beim ersten App-Start angezeigt.
 * Nutzer gibt Telefonnummer, Name und Adresse ein.
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { speichereNutzerProfil } from "@/lib/nutzer-store";
import { useColors } from "@/hooks/use-colors";

export default function OnboardingScreen() {
  const colors = useColors();
  const [schritt, setSchritt] = useState<1 | 2>(1);
  const [telefon, setTelefon] = useState("");
  const [name, setName] = useState("");
  const [strasse, setStrasse] = useState("");
  const [ort, setOrt] = useState("");
  const [plz, setPlz] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [dsgvoAkzeptiert, setDsgvoAkzeptiert] = useState(false);

  const registrierenMutation = trpc.nutzer.registrieren.useMutation({
    onSuccess: async (profil) => {
      await speichereNutzerProfil(profil);
      router.replace("/(tabs)");
    },
    onError: (err) => {
      setFehler(err.message);
    },
  });

  const weiterZuSchritt2 = () => {
    const tel = telefon.trim().replace(/\s/g, "");
    if (tel.length < 6) {
      setFehler("Bitte gib eine gültige Telefonnummer ein.");
      return;
    }
    setFehler(null);
    setSchritt(2);
  };

  const abschliessen = () => {
    if (name.trim().length < 2) {
      setFehler("Bitte gib deinen vollständigen Namen ein.");
      return;
    }
    if (!dsgvoAkzeptiert) {
      setFehler("Bitte stimme der Datenschutzerklärung zu, um fortzufahren.");
      return;
    }
    setFehler(null);
    registrierenMutation.mutate({
      telefon: telefon.trim().replace(/\s/g, ""),
      name: name.trim(),
      strasse: strasse.trim() || undefined,
      ort: ort.trim() || undefined,
      plz: plz.trim() || undefined,
    });
  };

  const s = styles(colors);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo-Bereich */}
          <View style={s.header}>
            <Text style={s.logo}>🌻</Text>
            <Text style={s.titel}>Gartenglück</Text>
            <Text style={s.untertitel}>Produkte aus Hobby-Anbau & -Haltung</Text>
          </View>

          {/* Fortschrittsanzeige */}
          <View style={s.fortschritt}>
            <View style={[s.punkt, schritt >= 1 && s.punktAktiv]} />
            <View style={s.linie} />
            <View style={[s.punkt, schritt >= 2 && s.punktAktiv]} />
          </View>

          {schritt === 1 ? (
            <View style={s.formular}>
              <Text style={s.schrittTitel}>Willkommen!</Text>
              <Text style={s.schrittText}>
                Damit wir dich als Käufer kennen, gib bitte deine Telefonnummer an.
                So können Anbieter dich bei Bestellungen erreichen.
              </Text>

              <Text style={s.label}>Telefonnummer *</Text>
              <TextInput
                style={s.input}
                value={telefon}
                onChangeText={setTelefon}
                placeholder="+49 151 12345678"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="next"
                onSubmitEditing={weiterZuSchritt2}
              />

              {fehler && <Text style={s.fehlerText}>{fehler}</Text>}

              <Pressable
                style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
                onPress={weiterZuSchritt2}
              >
                <Text style={s.buttonText}>Weiter →</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.formular}>
              <Text style={s.schrittTitel}>Deine Angaben</Text>
              <Text style={s.schrittText}>
                Dein Name und deine Adresse helfen Anbietern, deine Bestellung
                zuzuordnen und zu liefern.
              </Text>

              <Text style={s.label}>Vollständiger Name *</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Max Mustermann"
                placeholderTextColor={colors.muted}
                autoComplete="name"
                returnKeyType="next"
              />

              <Text style={s.label}>Straße & Hausnummer</Text>
              <TextInput
                style={s.input}
                value={strasse}
                onChangeText={setStrasse}
                placeholder="Musterstraße 12"
                placeholderTextColor={colors.muted}
                autoComplete="street-address"
                returnKeyType="next"
              />

              <View style={s.zeile}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.label}>PLZ</Text>
                  <TextInput
                    style={s.input}
                    value={plz}
                    onChangeText={setPlz}
                    placeholder="38889"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    maxLength={5}
                    returnKeyType="next"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={s.label}>Ort</Text>
                  <TextInput
                    style={s.input}
                    value={ort}
                    onChangeText={setOrt}
                    placeholder="Blankenburg"
                    placeholderTextColor={colors.muted}
                    autoComplete="postal-address-locality"
                    returnKeyType="done"
                    onSubmitEditing={abschliessen}
                  />
                </View>
              </View>

              {/* DSGVO-Einwilligung */}
              <View style={s.dsgvoBox}>
                <Text style={s.dsgvoTitel}>Datenschutz & Nutzungsbedingungen</Text>
                <Text style={s.dsgvoHinweis}>
                  Gartenglück ist eine Vermittlungsplattform. Kaufverträge kommen
                  ausschließlich zwischen dir und dem jeweiligen Anbieter zustande.
                  Gartenglück übernimmt keine Haftung für Produktqualität oder
                  Vertragserfüllung durch Anbieter.
                </Text>
                <Pressable
                  style={s.dsgvoZeile}
                  onPress={() => setDsgvoAkzeptiert(!dsgvoAkzeptiert)}
                >
                  <View style={[s.checkbox, dsgvoAkzeptiert && s.checkboxAktiv]}>
                    {dsgvoAkzeptiert && <Text style={s.checkboxHaken}>✓</Text>}
                  </View>
                  <Text style={s.dsgvoText}>
                    Ich habe die{" "}
                    <Text
                      style={s.dsgvoLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push("/datenschutz" as any);
                      }}
                    >
                      Datenschutzerklärung
                    </Text>
                    {" "}und die{" "}
                    <Text
                      style={s.dsgvoLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push("/nutzungsbedingungen" as any);
                      }}
                    >
                      Nutzungsbedingungen
                    </Text>
                    {" "}gelesen und stimme diesen zu. Ich bin damit einverstanden,
                    dass meine Daten (Name, Telefon, Adresse) zur Bestellabwicklung
                    gespeichert und an den jeweiligen Anbieter weitergegeben werden.
                    (Pflichtfeld *)
                  </Text>
                </Pressable>
              </View>

              {fehler && <Text style={s.fehlerText}>{fehler}</Text>}

              <Pressable
                style={({ pressed }) => [
                  s.button,
                  pressed && s.buttonPressed,
                  (registrierenMutation.isPending || !dsgvoAkzeptiert) && s.buttonDisabled,
                ]}
                onPress={abschliessen}
                disabled={registrierenMutation.isPending || !dsgvoAkzeptiert}
              >
                {registrierenMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Jetzt loslegen 🌱</Text>
                )}
              </Pressable>

              <Pressable
                style={s.zurueckButton}
                onPress={() => { setFehler(null); setSchritt(1); }}
              >
                <Text style={s.zurueckText}>← Zurück</Text>
              </Pressable>
            </View>
          )}

          <Text style={s.hinweis}>
            Datenschutzerklärung und Nutzungsbedingungen sind jederzeit in den
            Einstellungen der App abrufbar.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    scroll: {
      flexGrow: 1,
      padding: 24,
      paddingBottom: 48,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 16,
    },
    logo: {
      fontSize: 64,
      marginBottom: 8,
    },
    titel: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    untertitel: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
    },
    fortschritt: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 32,
    },
    punkt: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
    },
    punktAktiv: {
      backgroundColor: colors.primary,
    },
    linie: {
      width: 40,
      height: 2,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    formular: {
      gap: 4,
    },
    schrittTitel: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    schrittText: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
      marginBottom: 24,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.foreground,
    },
    zeile: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    fehlerText: {
      color: colors.error,
      fontSize: 13,
      marginTop: 8,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 24,
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "700",
    },
    zurueckButton: {
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 8,
    },
    zurueckText: {
      color: colors.muted,
      fontSize: 15,
    },
    hinweis: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "center",
      marginTop: 32,
      lineHeight: 16,
    },
    dsgvoZeile: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 20,
      gap: 12,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
      flexShrink: 0,
    },
    checkboxAktiv: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxHaken: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    dsgvoText: {
      flex: 1,
      fontSize: 13,
      color: colors.muted,
      lineHeight: 19,
    },
    dsgvoLink: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
    dsgvoBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginTop: 20,
    },
    dsgvoTitel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 6,
    },
    dsgvoHinweis: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 17,
      marginBottom: 4,
    },
  });
