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
