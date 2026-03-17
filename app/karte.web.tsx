/**
 * LocaBuy – Karten-Ansicht (Web-Fallback)
 * react-native-maps ist nicht auf Web verfügbar.
 */

import { router } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function KarteScreenWeb() {
  const colors = useColors();

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.container}>
        <Text style={[styles.emoji]}>🗺️</Text>
        <Text style={[styles.titel, { color: colors.foreground }]}>
          Karte nicht verfügbar
        </Text>
        <Text style={[styles.text, { color: colors.muted }]}>
          Die Kartenansicht ist nur in der iOS- und Android-App verfügbar.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>← Zurück zur Liste</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  titel: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  text: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  button: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
