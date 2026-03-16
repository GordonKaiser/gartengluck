/**
 * Gartenglück – Impressum
 * Anbieterkennzeichnung gemäß § 5 TMG
 */

import { ScrollView, Text, View, Pressable, StyleSheet, Linking } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function ImpressumScreen() {
  const colors = useColors();
  const s = styles(colors);

  return (
    <ScreenContainer>
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.zurueck, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <Text style={s.zurueckText}>← Zurück</Text>
        </Pressable>
        <Text style={s.titel}>Impressum</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.inhalt}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.paragraphTitel}>Angaben gemäß § 5 TMG</Text>

        <View style={s.karte}>
          <Text style={s.name}>Gordon Kaiser</Text>
          <Text style={s.zeile}>Bahnhofstr. 10</Text>
          <Text style={s.zeile}>38889 Blankenburg (Harz)</Text>
          <Text style={s.zeile}>Deutschland</Text>
        </View>

        <View style={s.karte}>
          <Text style={s.label}>Kontakt</Text>
          <Pressable
            onPress={() => Linking.openURL("mailto:gordon.kaiser@icloud.com")}
          >
            <Text style={s.link}>gordon.kaiser@icloud.com</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("tel:+491737483298")}
          >
            <Text style={s.link}>+49 173 7483298</Text>
          </Pressable>
        </View>

        <View style={s.karte}>
          <Text style={s.label}>Hinweis</Text>
          <Text style={s.text}>
            Diese App wird von einer Privatperson ohne eingetragenes Gewerbe
            betrieben. Gartenglück ist eine nicht-kommerzielle Vermittlungsplattform
            für Produkte aus privatem Hobby-Anbau und Hobby-Haltung.
          </Text>
        </View>

        <View style={s.karte}>
          <Text style={s.label}>Haftung für Inhalte</Text>
          <Text style={s.text}>
            Die Inhalte dieser App wurden mit größter Sorgfalt erstellt. Für die
            Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch
            keine Gewähr übernommen werden. Als Vermittlungsplattform sind wir
            gemäß § 7 Abs. 1 TMG für eigene Inhalte nach den allgemeinen Gesetzen
            verantwortlich. Für Inhalte und Angebote der registrierten Anbieter
            übernehmen wir keine Haftung.
          </Text>
        </View>

        <View style={s.karte}>
          <Text style={s.label}>Streitschlichtung</Text>
          <Text style={s.text}>
            Die Europäische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <Text
              style={s.link}
              onPress={() =>
                Linking.openURL("https://ec.europa.eu/consumers/odr")
              }
            >
              https://ec.europa.eu/consumers/odr
            </Text>
            {"\n\n"}
            Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen.
          </Text>
        </View>

        <Text style={s.stand}>Stand: März 2026</Text>
      </ScrollView>
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
    zurueck: {
      marginBottom: 8,
    },
    zurueckText: {
      fontSize: 15,
      color: colors.primary,
    },
    titel: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.foreground,
    },
    inhalt: {
      padding: 20,
      paddingBottom: 40,
    },
    paragraphTitel: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 12,
    },
    karte: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    name: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 4,
    },
    zeile: {
      fontSize: 15,
      color: colors.foreground,
      lineHeight: 22,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 21,
    },
    link: {
      fontSize: 15,
      color: colors.primary,
      textDecorationLine: "underline",
      lineHeight: 24,
    },
    stand: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "center",
      marginTop: 8,
    },
  });
