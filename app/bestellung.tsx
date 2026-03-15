/**
 * Gartenglück – Bestellformular-Screen
 * Zeigt Warenkorb-Übersicht, vorausgefüllte Kundendaten und sendet Bestellung via API.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { sendeBestellung, formatPreis, type BestellProdukt } from "@/lib/hofmarkt-api";
import { ladeNutzerProfil, type NutzerProfil } from "@/lib/nutzer-store";
import { useWarenkorb } from "@/lib/warenkorb-store";

const BESTELLHISTORIE_KEY = "gartengluck_bestellhistorie";

type Phase = "formular" | "bestaetigung";

export default function BestellungScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ hofUserId: string; hofName: string }>();
  const hofUserId = parseInt(params.hofUserId ?? "0");
  const hofName = params.hofName ?? "Hof";

  const { warenkorb, gesamtpreis, leere } = useWarenkorb();

  const [phase, setPhase] = useState<Phase>("formular");
  const [sendet, setSendet] = useState(false);
  const [bestellId, setBestellId] = useState<number | null>(null);

  // Kundendaten (vorausgefüllt aus Registrierung)
  const [name, setName] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [nachricht, setNachricht] = useState("");

  // Profil laden und Felder vorausfüllen
  useEffect(() => {
    ladeNutzerProfil().then((profil: NutzerProfil | null) => {
      if (profil) {
        setName(profil.name ?? "");
        setTelefon(profil.telefon ?? "");
        setStrasse(profil.strasse ?? "");
        setPlz(profil.plz ?? "");
        setOrt(profil.ort ?? "");
      }
    });
  }, []);

  const handleAbsenden = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Name fehlt", "Bitte gib deinen Namen an.");
      return;
    }
    if (!telefon.trim()) {
      Alert.alert("Telefon fehlt", "Bitte gib deine Telefonnummer an.");
      return;
    }
    if (!warenkorb || warenkorb.positionen.length === 0) {
      Alert.alert("Warenkorb leer", "Bitte wähle mindestens ein Produkt aus.");
      return;
    }

    setSendet(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const produkte: BestellProdukt[] = warenkorb.positionen.map((pos) => ({
        id: pos.produkt.id,
        name: pos.produkt.name,
        kategorie: pos.produkt.kategorie,
        menge: pos.menge,
        preis: pos.produkt.preis ?? "0",
        einheit: pos.produkt.einheit,
      }));

      const antwort = await sendeBestellung({
        hofUserId,
        kundeName: name.trim(),
        kundeTelefon: telefon.trim(),
        kundeEmail: email.trim() || undefined,
        kundeStrasse: strasse.trim() || undefined,
        kundePlz: plz.trim() || undefined,
        kundeOrt: ort.trim() || undefined,
        produkte,
        gesamtpreis: Math.round(gesamtpreis * 100) / 100,
        nachricht: nachricht.trim() || undefined,
      });

      if (antwort.success) {
        setBestellId(antwort.id);

        // Bestellhistorie speichern
        try {
          const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
          const historie = raw ? JSON.parse(raw) : [];
          historie.push({
            id: antwort.id,
            userId: hofUserId,
            hofName,
            datum: new Date().toISOString(),
            gesamtpreis,
            anzahlProdukte: warenkorb.positionen.length,
          });
          if (historie.length > 50) historie.splice(0, historie.length - 50);
          await AsyncStorage.setItem(BESTELLHISTORIE_KEY, JSON.stringify(historie));
        } catch {
          // Ignorieren
        }

        leere();
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setPhase("bestaetigung");
      } else {
        Alert.alert("Fehler", "Die Bestellung konnte nicht gesendet werden. Bitte versuche es erneut.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      Alert.alert("Fehler beim Senden", msg);
    } finally {
      setSendet(false);
    }
  }, [name, telefon, email, strasse, plz, ort, nachricht, warenkorb, hofUserId, hofName, gesamtpreis, leere]);

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
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
    sektion: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sektionTitel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    produktZeile: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    produktZeileName: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
    },
    produktZeileMenge: {
      fontSize: 14,
      color: colors.muted,
      marginHorizontal: 8,
    },
    produktZeilePreis: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    gesamtZeile: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    gesamtLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
    },
    gesamtPreis: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.primary,
    },
    eingabeZeile: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      gap: 10,
    },
    eingabeLabel: {
      fontSize: 14,
      color: colors.muted,
      width: 70,
    },
    eingabe: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
    },
    nachrichtEingabe: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.foreground,
      minHeight: 80,
      textAlignVertical: "top",
    },
    absendButton: {
      margin: 16,
      marginTop: 24,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    absendButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    hinweisText: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      marginHorizontal: 20,
      marginBottom: 8,
      lineHeight: 18,
    },
    // Bestätigungs-Screen
    bestaetigungContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    bestaetigungEmoji: {
      fontSize: 72,
      marginBottom: 24,
    },
    bestaetigungTitel: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 12,
    },
    bestaetigungText: {
      fontSize: 15,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 8,
    },
    bestaetigungId: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 8,
    },
    zurueckButton: {
      marginTop: 32,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 32,
      alignItems: "center",
    },
    zurueckButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
  });

  // ── Bestätigungsscreen ───────────────────────────────────────────────────────
  if (phase === "bestaetigung") {
    return (
      <ScreenContainer>
        <View style={styles.bestaetigungContainer}>
          <Text style={styles.bestaetigungEmoji}>✅</Text>
          <Text style={styles.bestaetigungTitel}>Bestellung gesendet!</Text>
          <Text style={styles.bestaetigungText}>
            Deine Bestellung wurde an{"\n"}
            <Text style={{ fontWeight: "700", color: colors.foreground }}>{hofName}</Text>
            {"\n"}weitergeleitet.
          </Text>
          <Text style={styles.bestaetigungText}>
            Der Hofbesitzer meldet sich telefonisch bei dir, um die Bestellung zu bestätigen.
          </Text>
          {bestellId && (
            <Text style={styles.bestaetigungId}>Bestellnummer: #{bestellId}</Text>
          )}
          <Pressable
            style={({ pressed }) => [styles.zurueckButton, pressed && { opacity: 0.85 }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.zurueckButtonText}>Zurück zur Startseite</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Bestellformular ──────────────────────────────────────────────────────────
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
        <Text style={styles.headerTitel}>Bestellung an {hofName}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Warenkorb-Übersicht */}
          <View style={styles.sektion}>
            <Text style={styles.sektionTitel}>Deine Bestellung</Text>
            {(warenkorb?.positionen ?? []).map((pos) => {
              const einzelpreis = parseFloat(pos.produkt.preis ?? "0");
              const gesamt = einzelpreis * pos.menge;
              return (
                <View key={pos.produkt.id} style={styles.produktZeile}>
                  <Text style={styles.produktZeileName}>{pos.produkt.name}</Text>
                  <Text style={styles.produktZeileMenge}>
                    {pos.menge}× {pos.produkt.einheit}
                  </Text>
                  <Text style={styles.produktZeilePreis}>
                    {gesamt.toFixed(2).replace(".", ",")} €
                  </Text>
                </View>
              );
            })}
            <View style={styles.gesamtZeile}>
              <Text style={styles.gesamtLabel}>Gesamt</Text>
              <Text style={styles.gesamtPreis}>
                {gesamtpreis.toFixed(2).replace(".", ",")} €
              </Text>
            </View>
          </View>

          {/* Kontaktdaten */}
          <View style={styles.sektion}>
            <Text style={styles.sektionTitel}>Deine Kontaktdaten</Text>
            <View style={styles.eingabeZeile}>
              <Text style={styles.eingabeLabel}>Name *</Text>
              <TextInput
                style={styles.eingabe}
                value={name}
                onChangeText={setName}
                placeholder="Vor- und Nachname"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>
            <View style={styles.eingabeZeile}>
              <Text style={styles.eingabeLabel}>Telefon *</Text>
              <TextInput
                style={styles.eingabe}
                value={telefon}
                onChangeText={setTelefon}
                placeholder="+49 151 12345678"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.eingabeZeile}>
              <Text style={styles.eingabeLabel}>E-Mail</Text>
              <TextInput
                style={styles.eingabe}
                value={email}
                onChangeText={setEmail}
                placeholder="optional"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Adresse – unsichtbar, Daten aus Registrierung werden still übermittelt */}

          {/* Nachricht */}
          <View style={styles.sektion}>
            <Text style={styles.sektionTitel}>Nachricht (optional)</Text>
            <TextInput
              style={styles.nachrichtEingabe}
              value={nachricht}
              onChangeText={setNachricht}
              placeholder="z.B. Bitte am Freitag bereitstellen"
              placeholderTextColor={colors.muted}
              multiline
              returnKeyType="done"
            />
          </View>

          {/* Absenden */}
          <Pressable
            style={({ pressed }) => [styles.absendButton, pressed && { opacity: 0.85 }, sendet && { opacity: 0.6 }]}
            onPress={handleAbsenden}
            disabled={sendet}
          >
            {sendet ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                <Text style={styles.absendButtonText}>Jetzt bestellen</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.hinweisText}>
            Der Hofbesitzer erhält deine Bestellung und meldet sich telefonisch bei dir.
            Es handelt sich um eine unverbindliche Anfrage — keine automatische Zahlung.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
