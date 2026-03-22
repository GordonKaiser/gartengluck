/**
 * LocaBuy – Onboarding-Screen
 * Phase 0: 3 Intro-Slides (was ist LocaBuy?)
 * Phase 1: Telefonnummer eingeben
 *   → Wenn Nummer bereits vorhanden: Login (Profil laden)
 *   → Wenn neu: weiter zu Phase 2
 * Phase 2: Name + Adresse + DSGVO (nur bei Neu-Registrierung)
 */

import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  FlatList,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { speichereNutzerProfil, ladeOderErstelleGeraeteId } from "@/lib/nutzer-store";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Intro-Slides ──────────────────────────────────────────────────────────────

const SLIDES = [
  {
    emoji: "🌿",
    titel: "Direkt vom Erzeuger",
    text: "Entdecke Hobby-Anbieter und kleine Bauernhöfe in deiner Nähe. Frische Produkte – ohne Zwischenhändler.",
  },
  {
    emoji: "📦",
    titel: "Einfach bestellen",
    text: "Schreib dem Anbieter direkt. Kein Konto, keine Wartezeit – du bestellst, der Anbieter packt ein.",
  },
  {
    emoji: "🤝",
    titel: "Lokal & persönlich",
    text: "Stärke die Region. Jede Bestellung geht direkt an Menschen in deiner Nachbarschaft.",
  },
];

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const colors = useColors();
  const s = styles(colors);

  // 0 = Intro-Slides, 1 = Telefon, 2 = Name/Adresse
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Formular-State
  const [telefon, setTelefon] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [strasse, setStrasse] = useState("");
  const [ort, setOrt] = useState("");
  const [plz, setPlz] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [dsgvoAkzeptiert, setDsgvoAkzeptiert] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Login-State (Telefon bereits vorhanden)
  const [pruefeNummer, setPruefeNummer] = useState(false);

  const referralMutation = trpc.nutzer.referralBeiRegistrierung.useMutation();

  const registrierenMutation = trpc.nutzer.registrieren.useMutation({
    onSuccess: async (profil) => {
      await speichereNutzerProfil(profil);
      // Referral-Code generieren und ggf. einlösen
      try {
        await referralMutation.mutateAsync({
          nutzerId: profil.id,
          inviteCode: inviteCode.trim() || undefined,
        });
      } catch (_) { /* Referral ist optional */ }
      router.replace("/(tabs)");
    },
    onError: (err) => {
      setFehler(err.message);
    },
  });

  // ── Slide-Navigation ──────────────────────────────────────────────────────

  const naechsterSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      const next = slideIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setSlideIndex(next);
    } else {
      setPhase(1);
    }
  };

  const onSlideScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setSlideIndex(idx);
  };

  // ── Formular-Logik ────────────────────────────────────────────────────────

  /**
   * Prüft ob die Telefonnummer bereits registriert ist.
   * Falls ja → Login (Profil laden + direkt einloggen).
   * Falls nein → weiter zu Phase 2 (Registrierung).
   */
  const weiterZuPhase2 = async () => {
    const tel = telefon.trim().replace(/\s/g, "");
    if (tel.length < 6) {
      setFehler("Bitte gib eine gültige Telefonnummer ein.");
      return;
    }
    setFehler(null);
    setPruefeNummer(true);

    try {
      // Prüfen ob Nummer bereits vorhanden (Login-Versuch)
      const geraeteId = await ladeOderErstelleGeraeteId();
      const client = createTRPCClient();
      const profil = await (client as any).nutzer.profil.query({ telefon: tel, geraeteId });

      if (profil) {
        // Nutzer existiert bereits → direkt einloggen
        await speichereNutzerProfil(profil);
        router.replace("/(tabs)");
        return;
      }
    } catch (err: any) {
      // Gesperrter Nutzer
      if (err?.message?.includes("gesperrt")) {
        setFehler(err.message);
        setPruefeNummer(false);
        return;
      }
      // Andere Fehler ignorieren → weiter zur Registrierung
    } finally {
      setPruefeNummer(false);
    }

    // Nummer nicht vorhanden → Registrierung
    setPhase(2);
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
    const emailTrimmed = email.trim();
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setFehler("Bitte gib eine gültige E-Mail-Adresse ein oder lass das Feld leer.");
      return;
    }
    ladeOderErstelleGeraeteId().then((geraeteId) => {
      registrierenMutation.mutate({
        telefon: telefon.trim().replace(/\s/g, ""),
        email: emailTrimmed || undefined,
        name: name.trim(),
        strasse: strasse.trim() || undefined,
        ort: ort.trim() || undefined,
        plz: plz.trim() || undefined,
        geraeteId,
      });
    });
  };

  // ── Intro-Slides ──────────────────────────────────────────────────────────

  if (phase === 0) {
    return (
      <ScreenContainer containerClassName="bg-background">
        {/* Skip-Button */}
        <Pressable
          style={({ pressed }) => [s.skipButton, pressed && { opacity: 0.6 }]}
          onPress={() => setPhase(1)}
        >
          <Text style={s.skipText}>Überspringen</Text>
        </Pressable>

        {/* Logo */}
        <View style={s.slideHeader}>
          <Text style={s.slideLogo}>🌻</Text>
          <Text style={s.slideAppName}>LocaBuy</Text>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSlideScroll}
          style={{ flexGrow: 0 }}
          renderItem={({ item }) => (
            <View style={s.slide}>
              <Text style={s.slideEmoji}>{item.emoji}</Text>
              <Text style={s.slideTitel}>{item.titel}</Text>
              <Text style={s.slideText}>{item.text}</Text>
            </View>
          )}
        />

        {/* Punkte-Indikator */}
        <View style={s.punkteReihe}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.punktSlide, i === slideIndex && s.punktSlideAktiv]}
            />
          ))}
        </View>

        {/* Weiter-Button */}
        <View style={s.slideFooter}>
          <Pressable
            style={({ pressed }) => [s.button, pressed && s.buttonPressed]}
            onPress={naechsterSlide}
          >
            <Text style={s.buttonText}>
              {slideIndex < SLIDES.length - 1 ? "Weiter →" : "Los geht's 🌱"}
            </Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // ── Registrierungs-Formular ───────────────────────────────────────────────

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
            <Text style={s.titel}>LocaBuy</Text>
            <Text style={s.untertitel}>Lokal kaufen. Direkt vom Erzeuger.</Text>
          </View>

          {/* Fortschrittsanzeige */}
          <View style={s.fortschritt}>
            <View style={[s.punkt, s.punktAktiv]} />
            <View style={s.linie} />
            <View style={[s.punkt, phase === 2 && s.punktAktiv]} />
          </View>

          {phase === 1 ? (
            <View style={s.formular}>
              <Text style={s.schrittTitel}>Willkommen!</Text>
              <Text style={s.schrittText}>
                Gib deine Telefonnummer ein. Falls du bereits ein Konto hast, wirst du automatisch eingeloggt.
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
                onSubmitEditing={weiterZuPhase2}
                editable={!pruefeNummer}
              />

              {/* Login-Hinweis */}
              <View style={s.loginHinweisBox}>
                <Text style={s.loginHinweisText}>
                  🔄 Bereits registriert? Gib einfach deine Telefonnummer ein – dein Konto und deine Bestellungen werden automatisch wiederhergestellt.
                </Text>
              </View>

              {fehler && <Text style={s.fehlerText}>{fehler}</Text>}

              <Pressable
                style={({ pressed }) => [
                  s.button,
                  pressed && s.buttonPressed,
                  pruefeNummer && s.buttonDisabled,
                ]}
                onPress={weiterZuPhase2}
                disabled={pruefeNummer}
              >
                {pruefeNummer ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.buttonText}>Weiter →</Text>
                )}
              </Pressable>

              <Pressable
                style={s.zurueckButton}
                onPress={() => { setFehler(null); setPhase(0); setSlideIndex(SLIDES.length - 1); }}
              >
                <Text style={s.zurueckText}>← Zurück</Text>
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

              <Text style={s.label}>E-Mail-Adresse (optional)</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="deine@email.de"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
              />
              <Text style={[s.hinweis, { marginBottom: 12 }]}>
                📧 Optional – wird für Bestellbestätigungen und Kontakt durch Anbieter genutzt.
              </Text>

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

              {/* Einladungscode (optional) */}
              <Text style={s.label}>Einladungscode (optional)</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <TextInput
                  style={[s.input, { flex: 1, marginBottom: 0 }]}
                  value={inviteCode}
                  onChangeText={(t) => setInviteCode(t.toUpperCase())}
                  placeholder="z.B. MARKT42"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </View>
              <Text style={[s.hinweis, { marginBottom: 16, marginTop: 2 }]}>
                🌟 Wurdest du von jemandem eingeladen? Gib hier den Code ein und schalte nach 3 Einladungen die Wunschliste frei.
              </Text>

              {/* DSGVO-Einwilligung */}
              <View style={s.dsgvoBox}>
                <Text style={s.dsgvoTitel}>Datenschutz & Nutzungsbedingungen</Text>
                <Text style={s.dsgvoHinweis}>
                  LocaBuy ist eine Vermittlungsplattform. Kaufverträge kommen
                  ausschließlich zwischen dir und dem jeweiligen Anbieter zustande.
                  LocaBuy übernimmt keine Haftung für Produktqualität oder
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
                onPress={() => { setFehler(null); setPhase(1); }}
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    // Intro-Slide Styles
    skipButton: {
      position: "absolute",
      top: 16,
      right: 20,
      zIndex: 10,
      padding: 8,
    },
    skipText: {
      fontSize: 14,
      color: colors.muted,
    },
    slideHeader: {
      alignItems: "center",
      marginTop: 56,
      marginBottom: 16,
    },
    slideLogo: {
      fontSize: 56,
      marginBottom: 4,
    },
    slideAppName: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
    },
    slide: {
      width: SCREEN_WIDTH,
      paddingHorizontal: 40,
      alignItems: "center",
      paddingTop: 24,
      paddingBottom: 16,
    },
    slideEmoji: {
      fontSize: 72,
      marginBottom: 20,
    },
    slideTitel: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "center",
      marginBottom: 12,
    },
    slideText: {
      fontSize: 16,
      color: colors.muted,
      textAlign: "center",
      lineHeight: 24,
    },
    punkteReihe: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 24,
      marginBottom: 8,
    },
    punktSlide: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    punktSlideAktiv: {
      width: 24,
      backgroundColor: colors.primary,
    },
    slideFooter: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      marginTop: 16,
    },

    // Formular Styles
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
      marginBottom: 20,
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
      padding: 14,
      fontSize: 16,
      color: colors.foreground,
    },
    zeile: {
      flexDirection: "row",
      gap: 0,
    },
    fehlerText: {
      color: colors.error,
      fontSize: 13,
      marginTop: 8,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginTop: 20,
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    zurueckButton: {
      alignItems: "center",
      padding: 12,
      marginTop: 4,
    },
    zurueckText: {
      color: colors.muted,
      fontSize: 14,
    },
    hinweis: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "center",
      marginTop: 32,
      lineHeight: 16,
    },
    loginHinweisBox: {
      backgroundColor: colors.primary + "15",
      borderRadius: 10,
      padding: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    loginHinweisText: {
      fontSize: 13,
      color: colors.primary,
      lineHeight: 18,
    },
    // DSGVO
    dsgvoBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dsgvoTitel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    dsgvoHinweis: {
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
      marginBottom: 12,
    },
    dsgvoZeile: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
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
      fontSize: 12,
      color: colors.muted,
      lineHeight: 18,
    },
    dsgvoLink: {
      color: colors.primary,
      textDecorationLine: "underline",
    },
  });
