# Hofmarkt App – TODO

## Setup & Branding
- [x] App-Logo generieren (Hofmarkt-Branding, Naturgrün)
- [x] theme.config.js mit Hofmarkt-Farben anpassen
- [x] app.config.ts mit App-Name und Logo-URL aktualisieren
- [x] Icon-Mappings in icon-symbol.tsx ergänzen

## Backend-Endpunkte (server/routers.ts)
- [x] hofmarkt.suche – PLZ-Umkreissuche implementieren
- [x] hofmarkt.hofProfil – Öffentliches Hof-Profil abrufen
- [x] hofmarkt.hofProdukte – Alle Produkte eines Hofes aggregiert
- [x] Schema: hof_profile + abonnements + plz_koordinaten in db.ts einbinden

## API-Client (lib/trpc.ts)
- [x] Backend-URL auf lokalen Server (shared DB) gesetzt – tRPC-Client nutzt getApiBaseUrl()

## Screens
- [x] Suche-Screen (PLZ-Eingabe, Radius-Auswahl, Suche starten)
- [x] Hof-Liste-Screen (FlatList mit Hof-Karten, Entfernung)
- [x] Hof-Detail-Screen (Profil, Produkte, Bestellbutton)
- [x] Favoriten-Screen (lokal gespeicherte Höfe)
- [x] Einstellungen-Screen (PLZ, Radius, Dark Mode)

## Komponenten
- [x] HofKarte-Komponente (inline in Entdecken-Screen)
- [x] ProduktListe-Komponente (inline in Hof-Detail-Screen)
- [x] ProduktBadge-Komponente (inline in Hof-Detail-Screen)
- [x] PLZEingabe-Komponente (inline in Entdecken-Screen)

## Navigation
- [x] Tab-Navigation: Entdecken / Favoriten / Einstellungen
- [x] Stack-Navigation: Hof-Liste → Hof-Detail

## Lokale Datenpersistenz
- [x] Letzte PLZ + Radius speichern (AsyncStorage)
- [x] Favoriten-Höfe speichern (AsyncStorage)

## Bugs
- [x] API-URL auf öffentliche URL umstellen (EXPO_PUBLIC_API_BASE_URL gesetzt)

## Umbenennung
- [x] App-Name auf "Gartenglück" ändern (war: Hofmarkt)
- [x] Untertitel auf "Produkte aus Hobby-Anbau & -Haltung" ändern
- [x] Neues Logo für Gartenglück generieren (Scheune + Produkte)
- [x] app.config.ts App-Name aktualisieren
- [x] Proxy zur externen Hobbyanbau-Suite-API implementiert (hofmarkt.suche + hofmarkt.hofProfil)

## API-Integration v2 (Batch-Format)
- [x] Direkter Fetch statt tRPC-Proxy — alle 4 Endpunkte mit batch=1 Format
- [x] hofmarkt.suche mit umkreisKm und optionalem kategorien-Filter
- [x] hofmarkt.produkte — vollständige Produktliste mit verfuegbar/vorbestellung
- [x] hofmarkt.plzLookup — Ortsname beim PLZ-Eingeben anzeigen (Debounce 500ms)
- [x] Kategorie-Filter-Chips im Entdecken-Screen (horizontal scrollbar)
- [x] Produkte im Hof-Detail gruppiert nach Kategorie anzeigen
- [x] Preisformatierung: "0.40" → "0,40 €" (formatPreis-Funktion)

## Nutzer-Registrierung & UX-Verbesserungen
- [x] Backend: gartengluck_nutzer-Tabelle (id, telefon, name, strasse, ort, plz, gesperrt, erstellt_am)
- [x] Backend: nutzer.registrieren Endpunkt (Telefonnummer + Name + Adresse)
- [x] Backend: nutzer.profil Endpunkt (eigenes Profil abrufen)
- [x] Backend: Admin-Endpunkte nutzer.sperren + nutzer.entsperren
- [x] Onboarding-Screen: Telefonnummer, Name, Strasse, Ort, PLZ (2-Schritt-Flow)
- [x] Onboarding: Nutzerdaten lokal in AsyncStorage gespeichert (nutzer-store.ts)
- [x] Root-Layout: Onboarding-Flow vor Tab-Navigation geschaltet
- [x] Favoriten-Screen auf userId umgestellt + "Zum Hof"-Button + Nutzerprofil-Anzeige + Abmelden
- [x] "Mehr anzeigen"-Toggle für lange Produktbeschreibungen im Hof-Detail

## Admin & Bestellhistorie
- [x] Admin-Bereich im Einstellungen-Screen (PIN-geschützt, alle Nutzer anzeigen, sperren/entsperren)
- [x] Backend: nutzer.alleNutzer Endpunkt (Admin-only, PIN-geschützt)
- [x] Bestellhistorie: lokale Liste im Favoriten-Tab (Hof + Datum, max. 50 Einträge)
- [x] Bestellhistorie: Eintrag wird beim "Jetzt bestellen"-Tap automatisch gespeichert

## Sicherheit
- [x] ADMIN_PIN als Server-Secret gesetzt (via Secrets-Einstellungen)

## Bestell-Flow
- [x] API-Client: bestellungSenden-Funktion ergänzt
- [x] Warenkorb-State (WarenkorbContext + WarenkorbProvider)
- [x] Hof-Detail-Screen: Mengenauswahl (+/-) pro Produkt
- [x] Hof-Detail-Screen: Warenkorb-Bar unten (Anzahl + Gesamtpreis + Öffnen-Button)
- [x] Bestellformular-Screen (Kundendaten vorausgefüllt, Adresse, Nachricht)
- [x] Bestätigungsscreen nach erfolgreicher Bestellung
- [x] Bestellhistorie-Eintrag nach erfolgreicher API-Bestellung

## Bugfixes (Tester-Feedback)
- [x] Falsche Kategorie-Icons korrigiert (Garten: 🥕 → 🌱)
- [x] Lieferadresse-Feld ausgeblendet (Daten aus Registrierung werden still übermittelt)

## API-Bugfixes v2 (Tester-Feedback)
- [x] Bug 1: Eier-Einheit "10er-Paket" / 4,00 € wird korrekt aus API übernommen (kein Fix nötig)
- [x] Bug 2: Garten-Produkte werden einzeln angezeigt; doppeltes Emoji behoben
- [x] Bug 3: Holz-Produkte werden einzeln angezeigt; doppeltes Emoji behoben
- [x] Bug 4: Bestellstruktur war bereits korrekt (id, name, kategorie, preis, einheit direkt aus API)

## Bugfixes v3 (API-Struktur-Update)
- [x] Bug 1: Produkte nicht angezeigt – Kategorien jetzt direkt aus Produkten abgeleitet (nicht aus kategorien-Array)
- [x] Bug 2: Einheit im Bestellformular korrekt angezeigt (z.B. "2× 10er-Paket")
- [x] Bug 3: Bestellstruktur war bereits korrekt – id, name, kategorie, preis, einheit direkt aus API

## Integration mit Hobbyanbau Suite (Push + Bestellstatus)
- [x] Push-Token beim App-Start registrieren (expo-notifications)
- [x] Push-Token im Backend in gartengluck_nutzer-Tabelle speichern (nutzer.pushToken-Endpunkt)
- [x] Notification-Handler im Root-Layout einrichten
- [x] "Meine Bestellungen"-Tab mit Status-Badge (neu/bestätigt/abgeholt/storniert)
- [x] Bestellstatus initial als "neu" gespeichert; Aktualisierung via Push-Benachrichtigung
- [x] Push-Benachrichtigung empfangen und auf Favoriten-Tab navigieren

## Status-Sync v1
- [x] Bestellstatus-Update via Push-Benachrichtigung (bestellId + neuerStatus in data)
- [x] Hofnamen-Abschneiden fixen (numberOfLines entfernt)

## Feature-Backlog v4 (Notizen 16.03.2026)

### Rechtliches
- [x] DSGVO-Einwilligung beim Onboarding (Checkbox + Links zu Datenschutz + Nutzungsbedingungen)
- [x] Datenschutzerklärung als In-App-Screen (app/datenschutz.tsx)
- [x] Nutzungsbedingungen mit Haftungsausschluss als In-App-Screen (app/nutzungsbedingungen.tsx)
- [x] Einstellungen-Screen: Datenschutz und Nutzungsbedingungen auf In-App-Screens verlinkt

### Vorbestellungen
- [ ] Vorbestellungen als auffälliger Marker anzeigen (z.B. orangefarbenes Badge)
- [ ] Bestellungen nur verfügbar wenn Hof "Verfügbar" gesetzt hat – sonst nur Vorbestellung möglich
- [ ] Vorbestellungs-Endpunkte in der API schaffen

### Sicherheit
- [ ] Passwortschutz für Nutzerkonto (PIN oder Passwort)
- [ ] Passwort zurücksetzen / vergessen-Funktion

### Zahlung
- [ ] PayPal-Integration nach Hof (Anzahlung oder Vollzahlung)
- [ ] Alternativ: Hof-Telefonkontakt + Bestätigung seitens Hof

### Bewertungen
- [ ] Bewertungen möglich machen (Sterne + Text)
- [ ] Bewertungen erst nach Bestellabwicklung möglich

### Navigation
- [x] Bestellungen einsehen – separater Reiter "Bestellungen" in Tab-Navigation

### Produkt-Filter
- [ ] Filter: gewerblich / Hobby-Trennung

### Admin
- [ ] Einstellungen: Admin-Nutzerverwaltung für normale Nutzer unsichtbar machen
- [ ] Nutzerverwaltung nur für Admin sichtbar (aktuell für alle sichtbar)

### Optional
- [ ] 0–5 Bilder von Hof-App (User-basiert) integrierbar machen (optionales Feature)

## Feature-Backlog v5 (16.03.2026)
- [x] Impressum-Screen erstellen und in Einstellungen verlinken
- [x] Admin-Bereich vollständig entfernt (kein Angriffspunkt)
- [x] Vorbestellungs-Badge im Hof-Detail (orangefarbenes Badge wenn vorbestellung: true)

## Feature-Backlog v5 – Vollständige Umsetzung (16.03.2026)
- [x] Impressum-Screen in Einstellungen verlinken
- [x] Admin-Bereich vollständig entfernt
- [x] Vorbestellungs-Badge im Hof-Detail (orangefarbenes Badge wenn vorbestellung: true)
- [x] Passwortschutz (PIN) für Nutzerkonto – PIN setzen + PIN-Abfrage beim Start
- [ ] Passwort vergessen / PIN zurücksetzen
- [x] Bewertungs-System: Sterne + Text nach Bestellabwicklung (Status = abgeholt)
- [x] Produkt-Filter: Hobby/Alle-Toggle in der Suche
- [x] Vorbestellungs-System: bereits korrekt implementiert (kannBestellen = verfuegbar || vorbestellung)
- [x] Aktualisierte Integrations-Doku für anderen Tab
- [x] Admin-Bereich komplett aus der App entfernen (kein Angriffspunkt für Nutzer)

## Feature-Backlog v6 (16.03.2026)
- [x] PIN vergessen / zurücksetzen (nach Eingabe der Telefonnummer)
- [x] Hof-Bilder-Galerie im Hof-Detail (horizontale Bildgalerie wenn bilder[] vorhanden)

## Railway-Deployment-Vorbereitung (16.03.2026)
- [x] Build-Format auf CJS umgestellt (--format=cjs in package.json)
- [x] jose auf v4.15.9 downgegradet (v5/v6 sind ESM-only, bricht CJS-Build)
- [x] API-Endpunkt auf HofSpot-Railway-URL umgestellt (hofspot-production.up.railway.app)
- [x] Integrations-Dokumentation mit Railway-Infos aktualisiert

## Railway-Deployment Phase 2 (16.03.2026)
- [x] gartengluck_nutzer-Tabelle in Railway-MySQL angelegt (vollständiges Schema)
- [x] HofSpot-Server hat bereits bestellungStatusAendern mit Push-Logik (liest push_token aus gartengluck_nutzer)
- [x] Gartenglück-App sendet Push-Token beim Start an nutzer.pushTokenSpeichern
- [ ] Gartenglück-Service auf Railway anlegen (neuer Service im zestful-sparkle Projekt)
- [ ] EXPO_PUBLIC_API_BASE_URL auf Gartenglück-Railway-URL setzen (nach Deployment)

## Railway-Deployment Abschluss (16.03.2026)
- [x] GitHub-Repo GordonKaiser/gartengluck angelegt und Code gepusht
- [x] Railway-Service gartengluck im Projekt zestful-sparkle erstellt
- [x] Umgebungsvariablen gesetzt (DATABASE_URL, NODE_ENV, PORT)
- [x] Domain gartengluck-production.up.railway.app generiert
- [x] Deployment erfolgreich – Server Online
- [x] EXPO_PUBLIC_API_BASE_URL auf gartengluck-production.up.railway.app gesetzt

## EAS Update (16.03.2026)
- [x] Expo-Projekt @gordon99/hofmarkt-app registriert (ID: 8f7f574b-415d-4912-9c4f-be79e1eb8d6f)
- [x] eas.json mit build-Profilen (development, preview, production) erstellt
- [x] app.config.ts mit updates.url, runtimeVersion und extra.eas.projectId ergänzt
- [x] Update-Kanal "production" bei Expo angelegt
- [ ] Ersten OTA-Update nach APK-Build veröffentlichen (eas update --channel production --message "...")

## HofSpot API v1.2 Kompatibilität (16.03.2026)
- [x] hofmarkt-api.ts: ladeHofProdukte nutzt hofProdukte zuerst, produkte als Fallback
- [x] BestellungStatusAntwort-Typ: bereit + abgelehnt ergänzt
- [x] Bestellungen-Screen: statusInfo für bereit (Alias) und abgelehnt (neu) eingebaut
- [x] Push-Handler Fallback: navigiert jetzt auf /(tabs)/bestellungen statt Favoriten

## Bestellstatus Live-Refresh (16.03.2026)
- [x] Bestellungen-Screen: Status beim Tab-Fokus vom HofSpot-Server abrufen (hofmarkt.bestellungStatus)

## App-Umbenennung zu LocaBuy (16.03.2026)
- [x] Neues LocaBuy-Logo generieren
- [x] App-Name in app.config.ts auf LocaBuy setzen
- [x] Logo-Dateien ersetzen (icon.png, splash-icon.png, favicon.png, android-icon-foreground.png)

## Gartenglück → LocaBuy Texte (16.03.2026)
- [x] Alle "Gartenglück"-Texte in App-Screens durch "LocaBuy" ersetzen

## Slogan-Änderung (16.03.2026)
- [x] Untertitel auf "Lokal kaufen. Direkt vom Erzeuger." ändern

## Bewertungs-Screen (16.03.2026)
- [x] app/bewertung.tsx erstellen (Sterne-Auswahl, Kommentar, Absenden)
- [x] API-Endpunkt hofmarkt.bewertungSenden in hofmarkt-api.ts prüfen/einbauen

## Neues Logo einsetzen (16.03.2026)
- [x] Nutzer-Logo als icon.png, splash-icon.png, favicon.png, android-icon-foreground.png einsetzen
- [x] app.config.ts logoUrl aktualisieren
- [x] theme.config.js auf LocaBuy-Farben anpassen (Dunkelrot, Grün, Orange, Gold)

## Bewertungsanzeige im Hof-Detail (16.03.2026)
- [x] hofmarkt.hofBewertungen-Endpunkt in hofmarkt-api.ts einbauen
- [x] Bewertungsanzeige (Durchschnittssterne + Kommentarliste) im Hof-Detail-Screen einbauen

## Urheberrechtsvermerk in AGBs (16.03.2026)
- [x] Rechtssichere Formulierung recherchieren (deutsches Urheberrecht, Markenrecht)
- [x] Urheberrechtsvermerk für Name und Logo in AGB-Screen einbauen

## Impressum prüfen und ergänzen (16.03.2026)
- [x] Bestehendes Impressum auf Vollständigkeit prüfen (§ 5 TMG, § 55 RStV)
- [x] Fehlende Pflichtangaben ergänzen: Verantwortlicher für Inhalt (§ 18 MStV) und Umsatzsteuer-Hinweis

## Bug: API-Fehler 500 bei Suche (17.03.2026)
- [x] Fehlerursache bei hofmarkt.suche (PLZ 37115) identifizieren (lag am LocaFarm-Server)
- [x] Fehler behoben (LocaFarm-seitig korrigiert)

## Feature-Umsetzung v7 (17.03.2026)
- [x] Bilder-Vollbild-Ansicht mit Swipe-Navigation (Tap auf Hof-Bild)
- [x] Vorbestellungs-System: bereits korrekt implementiert (kannBestellen = verfuegbar || vorbestellung)
- [x] Admin-Nutzerverwaltung: Admin-Bereich bereits vollständig entfernt

## Feature-Umsetzung v8 (17.03.2026)
- [x] PIN vergessen / zurücksetzen: bereits vollständig implementiert (Telefonnummer-Verifizierung in _layout.tsx)
- [x] Gewerblich/Hobby-Filter-Toggle: nurHobby-Parameter in suchHoefe(), UI-Label verbessert, Ergebniszeile zeigt Filter-Status

## Feature-Umsetzung v10 (17.03.2026)
- [x] Onboarding verbessern: 3 Intro-Slides (Direkt vom Erzeuger / Einfach bestellen / Lokal & persönlich) vor Registrierung, mit Skip-Button
- [x] Bewertungen im Hof-Detail anzeigen: bereits vollständig implementiert (Sterne + Kommentare, wartet auf LocaFarm-Daten)
- [x] Bilder-Galerie im Hof-Detail: bereits vollständig implementiert (horizontaler Scroll + Vollbild-Modal, wartet auf LocaFarm-Daten)

## HofSpot API v2.0 Anpassungen (17.03.2026)
- [x] API-Basis-URL auf https://gefluegel-app-ghkbktmv.manus.space/api/trpc aktualisiert
- [x] Push-Token-Registrierung auf hofmarkt.registrierePushToken umgestellt (_layout.tsx + hofmarkt-api.ts)

## Feature-Umsetzung v12 (17.03.2026)
- [x] Bewertung: kaeuferTelefon + kaeuferName aus Nutzerprofil mitschicken (bewertung.tsx)
- [x] Karte mit Hof-Pins einbauen (react-native-maps, Modal via /karte, Karte-Button in Ergebnisliste, grün=Hobby/rot=Gewerbe)
- [x] Übergabeprotokoll für HofSpot erstellt (locabuy-an-hofspot-v12.md)

## Feature-Umsetzung v13 (17.03.2026)
- [x] Bewertungs-Dialog nach Abholung: Push-Benachrichtigung neuerStatus=abgeholt löst Dialog aus (BewertungsDialogModal in _layout.tsx, leitet zu /bewertung weiter)
- [x] Bestellhistorie lokal in AsyncStorage speichern: speichereBestellungInHistorie() in nutzer-store.ts, vollständig mit Produkten, Bestellungen-Tab zeigt Produktliste
- [x] Hobby-Anbieter-Badge in der Hof-Karte der Suchliste: grün=Hobby-Anbieter, rot=Gewerblich, erscheint wenn hobbyAnbau-Feld verfügbar

## Referral-System v15 (18.03.2026)
- [x] DB-Migration: referral_codes + referral_einloesungen Tabellen angelegt
- [x] Drizzle-Schema: referralCodes + referralEinloesungen ergänzt
- [x] DB-Funktionen: getReferralCode, generateReferralCode, einloesenReferralCode, getReferralStatus
- [x] tRPC-Router: referral.meinCode, referral.meinStatus, referral.codeEinloesen, nutzer.referralBeiRegistrierung
- [x] Registrierung: inviteCode-Feld + Referral-Code generieren bei Neuregistrierung
- [x] Registrierungs-Screen: Einladungscode-Eingabefeld (optional, auto-uppercase, Bonus-Hinweis)
- [x] Freunde-einladen-Screen: Code anzeigen, Share-Sheet, Fortschrittsbalken, Stammkunde-Badge + Wunschliste-Belohnungen
- [x] Einstellungen: Community-Sektion mit "Freunde einladen" + "Wunschliste"
- [x] Wunschliste-Store: ladeWunschliste, aufWunschlisteSetzen, vonWunschlisteEntfernen, istAufWunschliste
- [x] Wunschliste-Screen: gesperrt-Ansicht (mit Link zu Freunde-einladen), freigeschaltet-Ansicht mit FlatList
- [x] Hof-Detail: Wunschliste-Herz-Button im Header (nur wenn hatWunschliste, toggle mit Haptics)

## Account & Login (Gerätewechsel-Unterstützung)
- [x] Login-Screen: Telefonnummer eingeben → Profil vom Server laden (Wiedereinstieg nach App-Löschung)
- [x] Onboarding: Unterscheidung zwischen Neu-Registrierung und Login (Telefonnummer bereits vorhanden)
- [x] Bestellhistorie server-seitig speichern (neue DB-Tabelle locabuy_bestellhistorie)
- [x] Bestellhistorie vom Server laden beim Login/App-Start
- [x] Einstellungen: Profil-Karte mit Name, Telefon, Adresse anzeigen
- [x] Einstellungen: Abmelden-Funktion (Profil lokal löschen, nicht vom Server)

## Profil-Bearbeitung & E-Mail (21.03.2026)
- [x] DB: E-Mail-Spalte in gartengluck_nutzer ergänzen
- [x] Server: nutzer.profilAktualisieren Endpunkt (Name, Strasse, Ort, PLZ, E-Mail)
- [x] Profil-Bearbeiten-Screen (app/profil-bearbeiten.tsx)
- [x] Einstellungen: "Profil bearbeiten"-Button in der Profil-Karte
- [x] E-Mail-Feld im Onboarding (Registrierung)
- [x] E-Mail-Feld im Onboarding (Login-Profil enthält E-Mail)
- [x] E-Mail im Bestellformular vorausgefüllt aus Profil
- [x] NutzerProfil-Typ um E-Mail erweitern
## Profilbild & Benachrichtigungseinstellungen (21.03.2026)
- [x] Expo ImagePicker + ImageManipulator Docs lesen
- [x] DB: profilbild_url-Spalte in gartengluck_nutzer ergänzen
- [x] Server: Datei-Upload-Endpunkt für Profilbilder (S3)
- [x] Server: nutzer.profilAktualisieren um profilbildUrl erweitern
- [x] Profil-Bearbeiten-Screen: Profilbild-Auswahl (Galerie/Kamera) mit Vorschau
- [x] Einstellungen: Profilbild im Avatar anzeigen (statt Buchstabe)
- [x] NutzerProfil-Typ um profilbildUrl erweitern
- [x] DB: push_benachrichtigungen-Spalte (boolean) in gartengluck_nutzer
- [x] Server: nutzer.profilAktualisieren um pushBenachrichtigungen erweitern
- [x] Profil-Bearbeiten-Screen: Push-Benachrichtigungen Toggle
- [x] Push-Token nur registrieren wenn Nutzer Benachrichtigungen aktiviert hat

## SMS-Verifizierung & Server-Fix (22.03.2026)
- [x] Bug-Fix: nutzer.einloggen → nutzer.profil im Onboarding
- [x] DB: geraete_id-Spalte in gartengluck_nutzer
- [x] Server: Registrierung speichert Geräte-ID
- [x] Server: Profil-Abfrage prüft Geräte-ID (Login mit neuer ID überschreibt alte)
- [x] App: Geräte-ID beim ersten Start generieren (UUID, SecureStore)
- [x] Onboarding: Geräte-ID bei Registrierung mitsenden
- [x] Onboarding: Geräte-ID beim Login mitsenden (Gerätewechsel)

## Konto-Löschung DSGVO (22.03.2026)
- [x] DB: loescheNutzer Funktion (löscht Profil + Bestellhistorie)
- [x] Server: nutzer.kontoLoeschen Endpunkt
- [x] Einstellungen: "Konto löschen"-Button mit Bestätigungs-Dialog
- [x] Nach Löschung: lokales Profil löschen + zurück zum Onboarding
