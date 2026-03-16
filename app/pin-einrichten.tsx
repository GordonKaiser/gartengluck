/**
 * PIN-Einrichten Screen
 * Nutzer kann einen 4-stelligen PIN setzen oder ändern.
 * PIN wird in AsyncStorage gespeichert und beim App-Start abgefragt.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export const APP_PIN_KEY = "gartengluck_app_pin";

export default function PinEinrichtenScreen() {
  const colors = useColors();
  const s = styles(colors);

  const [schritt, setSchritt] = useState<"eingabe" | "bestaetigen" | "alten_pin">("eingabe");
  const [pin, setPin] = useState("");
  const [pinWiederholung, setPinWiederholung] = useState("");
  const [fehler, setFehler] = useState("");
  const [pinEntfernenModus, setPinEntfernenModus] = useState(false);

  const handleWeiter = useCallback(async () => {
    if (pin.length < 4) {
      setFehler("Der PIN muss mindestens 4 Ziffern haben.");
      return;
    }

    // Prüfen ob bereits ein PIN gesetzt ist
    const vorhandenerPin = await AsyncStorage.getItem(APP_PIN_KEY);
    if (vorhandenerPin && schritt === "eingabe") {
      // Alten PIN zuerst bestätigen
      setSchritt("alten_pin");
      return;
    }

    setSchritt("bestaetigen");
    setFehler("");
  }, [pin, schritt]);

  const handleAltenPinPruefen = useCallback(async () => {
    const vorhandenerPin = await AsyncStorage.getItem(APP_PIN_KEY);
    if (pin !== vorhandenerPin) {
      setFehler("Falscher PIN. Bitte versuche es erneut.");
      setPin("");
      return;
    }
    setPin("");
    setFehler("");
    if (pinEntfernenModus) {
      await AsyncStorage.removeItem(APP_PIN_KEY);
      Alert.alert("PIN entfernt", "Der App-PIN wurde entfernt.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      setSchritt("eingabe");
    }
  }, [pin, pinEntfernenModus]);

  const handleBestaetigen = useCallback(async () => {
    if (pinWiederholung !== pin) {
      setFehler("Die PINs stimmen nicht überein. Bitte erneut eingeben.");
      setPinWiederholung("");
      return;
    }
    await AsyncStorage.setItem(APP_PIN_KEY, pin);
    Alert.alert("PIN gesetzt", "Dein App-PIN wurde erfolgreich gespeichert.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  }, [pin, pinWiederholung]);

  const handlePinEntfernen = useCallback(async () => {
    const vorhandenerPin = await AsyncStorage.getItem(APP_PIN_KEY);
    if (!vorhandenerPin) {
      Alert.alert("Kein PIN", "Es ist kein PIN gesetzt.");
      return;
    }
    setPinEntfernenModus(true);
    setPin("");
    setSchritt("alten_pin");
  }, []);

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.zurueck, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={s.zurueckText}>← Zurück</Text>
        </Pressable>
        <Text style={s.titel}>App-PIN</Text>
      </View>

      <View style={s.inhalt}>
        {schritt === "eingabe" && (
          <>
            <Text style={s.untertitel}>Neuen PIN eingeben</Text>
            <Text style={s.hinweis}>
              Der PIN schützt deine App vor unbefugtem Zugriff. Er wird beim
              nächsten App-Start abgefragt.
            </Text>
            <TextInput
              style={[s.pinInput, fehler ? s.pinInputFehler : null]}
              value={pin}
              onChangeText={(t) => { setPin(t.replace(/\D/g, "")); setFehler(""); }}
              placeholder="PIN (min. 4 Ziffern)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleWeiter}
            />
            {fehler ? <Text style={s.fehlerText}>{fehler}</Text> : null}
            <Pressable
              style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
              onPress={handleWeiter}
            >
              <Text style={s.buttonText}>Weiter →</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.entfernenButton, pressed && { opacity: 0.7 }]}
              onPress={handlePinEntfernen}
            >
              <Text style={s.entfernenText}>PIN entfernen</Text>
            </Pressable>
          </>
        )}

        {schritt === "alten_pin" && (
          <>
            <Text style={s.untertitel}>
              {pinEntfernenModus ? "PIN zum Entfernen bestätigen" : "Aktuellen PIN bestätigen"}
            </Text>
            <Text style={s.hinweis}>
              Bitte gib deinen aktuellen PIN ein, um fortzufahren.
            </Text>
            <TextInput
              style={[s.pinInput, fehler ? s.pinInputFehler : null]}
              value={pin}
              onChangeText={(t) => { setPin(t.replace(/\D/g, "")); setFehler(""); }}
              placeholder="Aktueller PIN"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleAltenPinPruefen}
            />
            {fehler ? <Text style={s.fehlerText}>{fehler}</Text> : null}
            <Pressable
              style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
              onPress={handleAltenPinPruefen}
            >
              <Text style={s.buttonText}>Bestätigen</Text>
            </Pressable>
          </>
        )}

        {schritt === "bestaetigen" && (
          <>
            <Text style={s.untertitel}>PIN wiederholen</Text>
            <Text style={s.hinweis}>
              Bitte gib deinen neuen PIN zur Bestätigung erneut ein.
            </Text>
            <TextInput
              style={[s.pinInput, fehler ? s.pinInputFehler : null]}
              value={pinWiederholung}
              onChangeText={(t) => { setPinWiederholung(t.replace(/\D/g, "")); setFehler(""); }}
              placeholder="PIN wiederholen"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              secureTextEntry
              maxLength={8}
              returnKeyType="done"
              onSubmitEditing={handleBestaetigen}
            />
            {fehler ? <Text style={s.fehlerText}>{fehler}</Text> : null}
            <Pressable
              style={({ pressed }) => [s.button, pressed && { opacity: 0.85 }]}
              onPress={handleBestaetigen}
            >
              <Text style={s.buttonText}>PIN speichern ✓</Text>
            </Pressable>
          </>
        )}
      </View>
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
    zurueck: { marginBottom: 8 },
    zurueckText: { fontSize: 15, color: colors.primary },
    titel: { fontSize: 26, fontWeight: "700", color: colors.foreground },
    inhalt: { flex: 1, padding: 24 },
    untertitel: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.foreground,
      marginBottom: 8,
    },
    hinweis: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 20,
      marginBottom: 24,
    },
    pinInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 18,
      color: colors.foreground,
      letterSpacing: 4,
      marginBottom: 8,
    },
    pinInputFehler: { borderColor: colors.error },
    fehlerText: { fontSize: 13, color: colors.error, marginBottom: 12 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    entfernenButton: { alignItems: "center", marginTop: 20 },
    entfernenText: { fontSize: 14, color: colors.error },
  });
