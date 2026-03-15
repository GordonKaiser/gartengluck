# Hofmarkt App – Design-Konzept

## Vision
Frische Produkte direkt vom Hof finden — regional, transparent, ohne Zwischenhändler.
Die App fühlt sich an wie ein natürlicher Teil des iOS-Ökosystems: klar, warm, vertrauenswürdig.

---

## Farbpalette

| Token | Licht | Dunkel | Bedeutung |
|---|---|---|---|
| `primary` | `#4A7C59` | `#6BAF80` | Naturgrün — Hof, Frische, Natur |
| `background` | `#FAFAF8` | `#141412` | Warmes Off-White / tiefes Dunkel |
| `surface` | `#F2F0EB` | `#1E1D1A` | Karten, Flächen — leicht warm |
| `foreground` | `#1A1A18` | `#EDEDEB` | Haupttext |
| `muted` | `#6B6860` | `#9A9890` | Sekundärtext, Labels |
| `border` | `#E0DDD6` | `#2E2D2A` | Trennlinien |
| `accent` | `#C8873A` | `#E0A060` | Warmes Bernstein — Ernte, Wärme |
| `success` | `#4A7C59` | `#6BAF80` | Verfügbar |
| `warning` | `#C8873A` | `#E0A060` | Vorbestellung |
| `error` | `#C0392B` | `#E05A4A` | Nicht verfügbar |

---

## Screen-Liste

### 1. Suche (Tab: Entdecken)
**Haupt-Einstieg der App.**
- Großes PLZ-Eingabefeld mit Tastatur-Fokus beim Start
- Radius-Auswahl: 10 / 25 / 50 km (Segmented Control)
- „Höfe finden"-Button (primär, grün)
- Letzte Suche wird lokal gespeichert (AsyncStorage)

### 2. Hof-Liste (nach Suche)
- FlatList mit Hof-Karten
- Jede Karte: Hofname, Ort, Entfernung, Produkt-Icons (Eier, Honig, Pilze etc.)
- Sortierung nach Entfernung
- Leerer Zustand: freundliche Meldung mit Radius-Erweiterungsvorschlag

### 3. Hof-Detail
- Header: Hofname, Ort, Entfernung
- Beschreibung des Hofes
- Produkt-Sektionen nach Kategorie (Geflügel, Imkerei, Pilze, Garten, Holz)
- Jedes Produkt: Name, Preis, Verfügbarkeit (sofort / Vorbestellung / nicht verfügbar)
- CTA: „Jetzt bestellen" → öffnet Shop-Link im Browser

### 4. Favoriten (Tab: Favoriten)
- Gespeicherte Höfe (lokal via AsyncStorage)
- Gleiche Karten-Darstellung wie Hof-Liste
- Leerer Zustand mit Hinweis zur Suche

### 5. Einstellungen (Tab: Einstellungen)
- Gespeicherte PLZ / Standard-Radius
- Dark Mode Toggle
- App-Version, Impressum-Link

---

## Key User Flows

### Flow A: Hof finden & bestellen
1. App öffnen → Suche-Tab aktiv
2. PLZ eingeben → Radius wählen → „Höfe finden" tippen
3. Hof-Liste erscheint, sortiert nach Entfernung
4. Hof-Karte antippen → Hof-Detail öffnet sich
5. Produkt ansehen → „Jetzt bestellen" tippen → Browser öffnet Shop-Link

### Flow B: Favorit speichern
1. Hof-Detail öffnen
2. Herz-Icon oben rechts tippen → Hof wird gespeichert
3. Favoriten-Tab zeigt gespeicherte Höfe

---

## Produkt-Icons (Emoji-Mapping)
| Modul | Icon |
|---|---|
| Geflügel (Eier) | 🥚 |
| Geflügel (Küken/Tiere) | 🐔 |
| Imkerei (Honig) | 🍯 |
| Pilze | 🍄 |
| Garten | 🥦 |
| Holz | 🪵 |

---

## Navigation
3 Tabs:
- **Entdecken** (Lupe-Icon) — PLZ-Suche + Ergebnisse
- **Favoriten** (Herz-Icon) — Gespeicherte Höfe
- **Einstellungen** (Zahnrad-Icon) — Präferenzen

---

## Typografie
- Überschriften: System-Font Bold (SF Pro auf iOS)
- Fließtext: System-Font Regular
- Preise: Monospace-ähnlich, gut lesbar

---

## Besonderheiten
- **Kein Login erforderlich** — alle Funktionen ohne Account nutzbar
- **Offline-fähig** — letzte Suchergebnisse werden gecacht
- **Vorbestellung** — ausgegraut mit Datum-Hinweis, WhatsApp-Link möglich
