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
