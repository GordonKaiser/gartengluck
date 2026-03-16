/**
 * LocaBuy – Datenschutzerklärung
 * Vollständige DSGVO-konforme Datenschutzerklärung als In-App-Screen.
 */

import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function DatenschutzScreen() {
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
        <Text style={s.titel}>Datenschutzerklärung</Text>
        <Text style={s.stand}>Stand: März 2026</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.inhalt}
        showsVerticalScrollIndicator={false}
      >
        <Section title="1. Verantwortlicher" colors={colors}>
          {`Verantwortlicher im Sinne der DSGVO ist der Betreiber der App LocaBuy. Kontaktdaten sind in den Einstellungen unter „Impressum" hinterlegt.`}
        </Section>

        <Section title="2. Welche Daten wir erheben" colors={colors}>
          {`Bei der Registrierung erheben wir:\n\n• Name (Vor- und Nachname)\n• Telefonnummer\n• Postleitzahl und Wohnort\n• Optional: Straße und Hausnummer\n\nDiese Daten sind erforderlich, damit Anbieter deine Bestellanfrage bearbeiten und dich kontaktieren können.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).`}
        </Section>

        <Section title="3. Bestelldaten" colors={colors}>
          {`Wenn du eine Bestellanfrage absendest, werden dein Name, deine Telefonnummer, deine Adresse sowie die bestellten Produkte an den jeweiligen Anbieter übermittelt.\n\nLocaBuy ist eine Vermittlungsplattform. Der Kaufvertrag kommt ausschließlich zwischen dir und dem jeweiligen Anbieter zustande. LocaBuy ist nicht Vertragspartei.\n\nBestelldaten werden lokal auf deinem Gerät gespeichert und können von dir jederzeit gelöscht werden.`}
        </Section>

        <Section title="4. Push-Benachrichtigungen" colors={colors}>
          {`Wenn du Push-Benachrichtigungen aktivierst, wird ein gerätespezifischer Push-Token auf unserem Server gespeichert. Dieser Token wird ausschließlich dazu verwendet, dir Statusmeldungen zu deinen Bestellungen zuzustellen.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).\n\nDu kannst Push-Benachrichtigungen jederzeit in den Systemeinstellungen deines Geräts deaktivieren.`}
        </Section>

        <Section title="5. Standortdaten" colors={colors}>
          {`Die App verwendet deine eingegebene Postleitzahl zur Umkreissuche nach Anbietern. Es werden keine GPS-Daten erhoben. Die PLZ-Eingabe ist freiwillig.`}
        </Section>

        <Section title="6. Weitergabe an Dritte" colors={colors}>
          {`Deine Daten werden ausschließlich an den jeweiligen Anbieter weitergegeben, bei dem du eine Bestellanfrage stellst. Eine Weitergabe an sonstige Dritte, Werbepartner oder andere Unternehmen findet nicht statt.\n\nDie Anbieter auf der Plattform sind eigenständige Verantwortliche im Sinne der DSGVO für die Verarbeitung der ihnen übermittelten Bestelldaten.`}
        </Section>

        <Section title="7. Datensicherheit" colors={colors}>
          {`Deine Daten werden auf Servern innerhalb der Europäischen Union gespeichert. Wir setzen technische und organisatorische Maßnahmen ein, um deine Daten gegen unbefugten Zugriff zu schützen. Die Datenbankverbindung ist SSL-verschlüsselt.`}
        </Section>

        <Section title="8. Deine Rechte" colors={colors}>
          {`Du hast folgende Rechte:\n\n• Auskunft (Art. 15 DSGVO)\n• Berichtigung (Art. 16 DSGVO)\n• Löschung (Art. 17 DSGVO)\n• Einschränkung der Verarbeitung (Art. 18 DSGVO)\n• Datenübertragbarkeit (Art. 20 DSGVO)\n• Widerspruch (Art. 21 DSGVO)\n• Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)\n\nZur Ausübung deiner Rechte wende dich an den Betreiber (Kontakt in den Einstellungen).\n\nDu hast außerdem das Recht, dich bei der zuständigen Datenschutz-Aufsichtsbehörde zu beschweren.`}
        </Section>

        <Section title="9. Kontolöschung" colors={colors}>
          {`Du kannst dein Nutzerprofil und alle damit verbundenen Daten jederzeit in der App unter Einstellungen → Konto löschen vollständig entfernen. Alle gespeicherten Daten werden innerhalb von 30 Tagen unwiderruflich gelöscht.`}
        </Section>

        <View style={s.hinweisBox}>
          <Text style={s.hinweisText}>
            Diese Datenschutzerklärung wurde nach bestem Wissen erstellt. Für eine
            individuelle rechtliche Beratung empfehlen wir die Konsultation eines
            Fachanwalts für IT-Recht.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: string;
  colors: ReturnType<typeof useColors>;
}) {
  const s = styles(colors);
  return (
    <View style={s.section}>
      <Text style={s.sectionTitel}>{title}</Text>
      <Text style={s.sectionText}>{children}</Text>
    </View>
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
    stand: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    inhalt: {
      padding: 20,
      paddingBottom: 40,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitel: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    sectionText: {
      fontSize: 14,
      color: colors.muted,
      lineHeight: 21,
    },
    hinweisBox: {
      backgroundColor: colors.warning + "15",
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.warning + "40",
      marginTop: 8,
    },
    hinweisText: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      fontStyle: "italic",
    },
  });
