/**
 * LocaBuy – Nutzungsbedingungen
 * Vollständige Nutzungsbedingungen mit Haftungsausschluss als In-App-Screen.
 */

import { ScrollView, Text, View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function NutzungsbedingungenScreen() {
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
        <Text style={s.titel}>Nutzungsbedingungen</Text>
        <Text style={s.stand}>Stand: März 2026</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.inhalt}
        showsVerticalScrollIndicator={false}
      >
        <Section title="1. Geltungsbereich" colors={colors}>
          {`Diese Nutzungsbedingungen gelten für die Nutzung der mobilen App LocaBuy. Mit der Registrierung erkennst du diese Bedingungen an.\n\nLocaBuy ist eine Vermittlungsplattform für Produkte aus Hobby-Anbau und Hobby-Haltung. Die App ermöglicht es, lokale Anbieter zu entdecken und Bestellanfragen zu stellen.`}
        </Section>

        <Section title="2. Vermittlungscharakter" colors={colors}>
          {`LocaBuy ist kein Händler und wird nicht Vertragspartei des zwischen Käufer und Anbieter geschlossenen Kaufvertrags.\n\nDer Kaufvertrag kommt ausschließlich zwischen dem Käufer und dem jeweiligen Anbieter zustande. LocaBuy übernimmt keine Verantwortung für die Vertragserfüllung.\n\nLocaBuy übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der von Anbietern eingestellten Produktinformationen, Preise oder Verfügbarkeiten.`}
        </Section>

        <View style={s.warnBox}>
          <Text style={s.warnTitel}>⚠️ Wichtiger Haftungshinweis</Text>
          <Text style={s.warnText}>
            {`LocaBuy haftet nicht für:\n\n• Produktqualität, Frische oder Sicherheit der angebotenen Waren\n• Nicht-Lieferung oder verspätete Lieferung durch Anbieter\n• Schäden, die aus dem Kauf von Produkten entstehen\n• Lebensmittelrechtliche Mängel der vermittelten Produkte\n\nAnbieter auf der Plattform sind private Hobbyhalter und Hobbyanbauer. Die Produkte unterliegen nicht zwingend den Kontrollen des gewerblichen Lebensmittelhandels. Der Käufer trägt die Verantwortung für die Prüfung der Produktqualität bei der Abholung.`}
          </Text>
        </View>

        <Section title="3. Haftung für die App" colors={colors}>
          {`Die Haftung des Betreibers für leichte Fahrlässigkeit ist – soweit gesetzlich zulässig – ausgeschlossen. Dies gilt nicht für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für Schäden aus der Verletzung wesentlicher Vertragspflichten.\n\nDer Betreiber übernimmt keine Gewähr für die ununterbrochene Verfügbarkeit der App.`}
        </Section>

        <Section title="4. Pflichten der Nutzer" colors={colors}>
          {`Du verpflichtest dich:\n\n• Keine falschen oder irreführenden Angaben zu machen\n• Die App nicht für rechtswidrige Zwecke zu nutzen\n• Keine Bestellanfragen zu stellen, die du nicht ernsthaft beabsichtigst\n• Anbieter respektvoll zu behandeln`}
        </Section>

        <Section title="5. Bewertungen" colors={colors}>
          {`Nach abgeschlossener Bestellung kannst du eine Bewertung abgeben. Bewertungen müssen wahrheitsgemäß und sachlich sein. Beleidigende, verleumderische oder unwahre Bewertungen sind untersagt und können entfernt werden.`}
        </Section>

        <Section title="6. Kündigung" colors={colors}>
          {`Du kannst dein Konto jederzeit in den Einstellungen der App löschen. Mit der Löschung werden alle personenbezogenen Daten innerhalb von 30 Tagen entfernt.\n\nDer Betreiber behält sich vor, Konten bei Verstößen gegen diese Nutzungsbedingungen zu sperren oder zu löschen.`}
        </Section>

        <Section title="7. Anwendbares Recht" colors={colors}>
          {`Es gilt das Recht der Bundesrepublik Deutschland.`}
        </Section>

        <Section title="8. Urheberrecht & Markenrecht" colors={colors}>
          {`© 2026 LocaBuy. Alle Rechte vorbehalten.`}
        </Section>

        <View style={s.urheberBox}>
          <Text style={s.urheberTitel}>Schutz von Name und Logo</Text>
          <Text style={s.urheberText}>
            {`Der Name „LocaBuy", das LocaBuy-Logo sowie alle weiteren Kennzeichen, Grafiken, Symbole und das Erscheinungsbild der App sind urheberrechtlich und/oder markenrechtlich geschützt. Das Urheberrecht liegt beim Betreiber der App.\n\nJede Nutzung, Vervielfältigung, Verbreitung, öffentliche Wiedergabe oder sonstige Verwertung des Namens, des Logos oder anderer Bestandteile des Erscheinungsbilds von LocaBuy – auch in veränderter Form – ist ohne ausdrückliche schriftliche Zustimmung des Betreibers untersagt.\n\nDies gilt insbesondere für:\n• Die Nutzung des Namens „LocaBuy" oder verwechslungsfähiger Bezeichnungen als Unternehmens-, Produkt- oder Domainname\n• Die Nutzung des LocaBuy-Logos oder ähnlicher Grafiken\n• Die Verwendung des Erscheinungsbilds der App für eigene Produkte oder Dienstleistungen\n• Die Nutzung der Inhalte dieser App zum Zwecke des Text- und Data Minings durch KI-Systeme\n\nVerstöße gegen das Urheberrecht sind gemäß §§ 106 ff. UrhG strafbar und berechtigen den Betreiber zur Geltendmachung von Unterlassung, Schadensersatz und Erstattung von Abmahnkosten (§ 97 UrhG).`}
          </Text>
        </View>

        <View style={s.hinweisBox}>
          <Text style={s.hinweisText}>
            Diese Nutzungsbedingungen wurden nach bestem Wissen erstellt, ersetzen
            jedoch keine individuelle Rechtsberatung. Für eine rechtssichere Prüfung
            empfehlen wir die Konsultation eines auf IT-Recht spezialisierten
            Rechtsanwalts.
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
    warnBox: {
      backgroundColor: colors.error + "12",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.error + "30",
      marginBottom: 24,
    },
    warnTitel: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.error,
      marginBottom: 8,
    },
    warnText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
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
    urheberBox: {
      backgroundColor: colors.primary + "10",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      marginBottom: 24,
    },
    urheberTitel: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: colors.primary,
      marginBottom: 10,
    },
    urheberText: {
      fontSize: 13,
      color: colors.muted,
      lineHeight: 20,
    },
  });
