/**
 * LocaBuy – API-Client für die Hobbyanbau Suite
 * Alle Endpunkte sind öffentlich (kein Login nötig).
 * Format: HTTP GET mit ?batch=1&input={"0":{"json": ... }}
 */

const BASIS_URL = "https://gefluegel-app-ghkbktmv.manus.space/api/trpc";

// ── TypeScript-Typen ─────────────────────────────────────────────────────────

export type Kategorie = "eier" | "gefluegel" | "pilze" | "imkerei" | "garten" | "holz";

export interface HofSucheErgebnis {
  userId: number;
  hofName: string;
  plz: string;
  ort: string;
  beschreibung: string | null;
  shopLink: string | null;
  distanzKm: number;
  hobbyAnbau?: boolean;   // true = Hobby-Anbieter, false = Gewerblich
  lat?: string | null;    // Breitengrad (für Kartenansicht)
  lon?: string | null;    // Längengrad (für Kartenansicht)
  produkte?: Kategorie[]; // nur wenn Kategorie-Filter aktiv
}

export interface HofProdukt {
  id: string;
  name: string;
  kategorie: Kategorie;
  verfuegbar: boolean;
  vorbestellung: boolean;
  vorbestellungDatum: string | null;
  preis: string | null;
  einheit: string;
  beschreibung: string | null;
}

export interface HofProdukteAntwort {
  kategorien: Kategorie[];
  produkte: HofProdukt[];
}

export interface HofProfil {
  id: number;
  userId: number;
  hofName: string;
  plz: string | null;
  ort: string | null;
  lat: string | null;
  lon: string | null;
  beschreibung: string | null;
  aktiv: boolean;
  shopLink: string | null;
  bilder?: string[]; // optionale Hof-Bilder (URLs)
}

export interface BestellProdukt {
  id: string;
  name: string;
  kategorie: string;
  menge: number;
  preis: string;
  einheit: string;
}

export interface BestellungSenden {
  hofUserId: number;
  kundeName: string;
  kundeTelefon: string;
  kundeEmail?: string;
  kundeStrasse?: string;
  kundePlz?: string;
  kundeOrt?: string;
  produkte: BestellProdukt[];
  gesamtpreis?: number;
  nachricht?: string;
  /** Expo Push-Token des Käufers – HofSpot nutzt ihn um den Käufer bei Statusänderungen zu benachrichtigen. */
  kundePushToken?: string;
}

export interface BestellungAntwort {
  id: number;
  success: boolean;
}

export interface PlzOrt {
  plz: string;
  ort: string;
}

// ── Hilfsfunktion ────────────────────────────────────────────────────────────

async function batchPost<T>(endpunkt: string, body: Record<string, unknown>): Promise<T> {
  const url = `${BASIS_URL}/${endpunkt}?batch=1`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "0": { json: body } }),
  });
  if (!res.ok) {
    throw new Error(`API-Fehler ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  const ergebnis = Array.isArray(data) ? data[0] : data;
  if (ergebnis?.error) {
    throw new Error(ergebnis.error.json?.message ?? "Unbekannter API-Fehler");
  }
  return ergebnis.result.data.json as T;
}

async function batchGet<T>(endpunkt: string, input: Record<string, unknown>): Promise<T> {
  const inputStr = JSON.stringify({ "0": { json: input } });
  const url = `${BASIS_URL}/${endpunkt}?batch=1&input=${encodeURIComponent(inputStr)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API-Fehler ${res.status}: ${res.statusText}`);
  }
  const body = await res.json();
  // Batch-Antwort: Array mit einem Element
  const ergebnis = Array.isArray(body) ? body[0] : body;
  if (ergebnis?.error) {
    throw new Error(ergebnis.error.json?.message ?? "Unbekannter API-Fehler");
  }
  return ergebnis.result.data.json as T;
}

// ── Endpunkte ────────────────────────────────────────────────────────────────

/**
 * Höfe im Umkreis einer PLZ suchen.
 * @param plz          5-stellige Postleitzahl
 * @param umkreisKm    Suchradius in km (z.B. 10, 25, 50)
 * @param kategorien   Optionaler Filter (z.B. ["eier", "pilze"])
 * @param nurHobby     Wenn true: nur Hobby-Anbieter (kein Gewerbe)
 */
export async function suchHoefe(
  plz: string,
  umkreisKm: number,
  kategorien?: Kategorie[],
  nurHobby?: boolean
): Promise<HofSucheErgebnis[]> {
  const input: Record<string, unknown> = { plz, umkreisKm };
  if (kategorien && kategorien.length > 0) {
    input.kategorien = kategorien;
  }
  // nurHobby=true filtert gewerbliche Anbieter heraus (sofern LocaFarm den Parameter unterstützt)
  if (nurHobby === true) {
    input.nurHobby = true;
  }
  const ergebnisse = await batchGet<HofSucheErgebnis[]>("hofmarkt.suche", input);
  // Client-seitiger Fallback: Wenn der Server nurHobby noch nicht unterstützt,
  // filtern wir anhand des hobbyAnbau-Flags im Ergebnis (falls vorhanden)
  if (nurHobby === true) {
    return ergebnisse.filter((h) => {
      // Wenn das Feld fehlt (ältere API), alle anzeigen (sicherer Fallback)
      if (h.hobbyAnbau === undefined) return true;
      return h.hobbyAnbau === true;
    });
  }
  return ergebnisse;
}

/**
 * Alle Produkte eines Hofes abrufen.
 * @param userId  userId des Hofes (aus der Suche)
 */
export async function ladeHofProdukte(userId: number): Promise<HofProdukteAntwort> {
  // HofSpot v1.2: hofProdukte ist der neue Name, produkte ist der Legacy-Alias
  // Wir versuchen zuerst hofProdukte, dann produkte als Fallback
  try {
    return await batchGet<HofProdukteAntwort>("hofmarkt.hofProdukte", { userId });
  } catch {
    return batchGet<HofProdukteAntwort>("hofmarkt.produkte", { userId });
  }
}

/**
 * Öffentliches Hof-Profil abrufen.
 * @param userId  userId des Hofes
 */
export async function ladeHofProfil(userId: number): Promise<HofProfil | null> {
  try {
    return await batchGet<HofProfil>("hofmarkt.hofProfil", { userId });
  } catch {
    return null;
  }
}

/**
 * Bestellung an einen Hof senden.
 */
export async function sendeBestellung(bestellung: BestellungSenden): Promise<BestellungAntwort> {
  return batchPost<BestellungAntwort>("hofmarkt.bestellungSenden", bestellung as unknown as Record<string, unknown>);
}

export interface BestellungStatusAntwort {
  id: number;
  // HofSpot v1.2: "bereit" ist Alias für "abholbereit"
  status: "neu" | "bestaetigt" | "abholbereit" | "bereit" | "abgeholt" | "storniert" | "abgelehnt";
}

/**
 * Status einer Bestellung abrufen (nach Bestellnummer).
 * Gibt null zurück wenn der Endpunkt noch nicht verfügbar ist.
 */
export async function ladeBestellungStatus(
  bestellId: number
): Promise<BestellungStatusAntwort | null> {
  try {
    return await batchGet<BestellungStatusAntwort>("hofmarkt.bestellungStatus", { id: bestellId });
  } catch {
    return null;
  }
}

/**
 * Ortsname zu einer PLZ ermitteln (für Autocomplete).
 * @param plz  5-stellige Postleitzahl
 */
export async function plzLookup(plz: string): Promise<PlzOrt | null> {
  try {
    return await batchGet<PlzOrt>("hofmarkt.plzLookup", { plz });
  } catch {
    return null;
  }
}

// ── Hilfsfunktionen für die UI ───────────────────────────────────────────────

/** Preis als deutschen Währungsstring formatieren */
export function formatPreis(preis: string | null, einheit: string): string {
  if (!preis) return "Preis auf Anfrage";
  const betrag = parseFloat(preis).toFixed(2).replace(".", ",");
  return `${betrag} € / ${einheit}`;
}

/** Kategorie-Metadaten mit Typ-Kennzeichnung (hobby = Privatperson, gewerbe = gewerblich) */
export const KATEGORIEN: { id: Kategorie; label: string; emoji: string; typ: "hobby" | "gewerbe" }[] = [
  { id: "eier",      label: "Eier",     emoji: "🥚", typ: "hobby" },
  { id: "gefluegel", label: "Gefügel", emoji: "🐓", typ: "hobby" },
  { id: "pilze",     label: "Pilze",    emoji: "🍄", typ: "hobby" },
  { id: "imkerei",   label: "Imkerei",  emoji: "🍯", typ: "hobby" },
  { id: "garten",    label: "Garten",   emoji: "🌱", typ: "hobby" },
  { id: "holz",      label: "Holz",     emoji: "🪵", typ: "hobby" },
];

/** Alle Kategorien sind aktuell Hobby-Anbau. Gewerbliche Kategorien können später ergänzt werden. */
export const HOBBY_KATEGORIEN = KATEGORIEN.filter((k) => k.typ === "hobby");
export const GEWERBE_KATEGORIEN = KATEGORIEN.filter((k) => k.typ === "gewerbe");

export const KATEGORIE_MAP = Object.fromEntries(
  KATEGORIEN.map((k) => [k.id, k])
) as Record<Kategorie, { id: Kategorie; label: string; emoji: string; typ: "hobby" | "gewerbe" }>;

// ── Bewertungen ──────────────────────────────────────────────────────────────

export interface BewertungInput {
  userId: number;
  sterne: 1 | 2 | 3 | 4 | 5;
  kommentar?: string;
  kaeuferTelefon?: string;
  kaeuferName?: string;
}

/**
 * Sterne-Bewertung für einen Hof an HofSpot senden.
 * HofSpot benötigt dafür den Endpunkt hofmarkt.bewertungSenden.
 */
export async function sendeHofBewertung(input: BewertungInput): Promise<void> {
  await batchPost<void>("hofmarkt.bewertungSenden", input as unknown as Record<string, unknown>);
}

export interface HofBewertung {
  id: number;
  sterne: 1 | 2 | 3 | 4 | 5;
  kommentar: string | null;
  createdAt: string;
}

export interface HofBewertungenAntwort {
  durchschnitt: number;    // z.B. 4.3
  anzahl: number;
  bewertungen: HofBewertung[];
}

/**
 * Bewertungen eines Hofes laden.
 * Benötigt hofmarkt.hofBewertungen in LocaFarm.
 * Gibt null zurück wenn der Endpunkt noch nicht verfügbar ist.
 */
export async function ladeHofBewertungen(userId: number): Promise<HofBewertungenAntwort | null> {
  try {
    return await batchGet<HofBewertungenAntwort>("hofmarkt.hofBewertungen", { userId });
  } catch {
    return null;
  }
}

// ── Push-Token-Registrierung ─────────────────────────────────────────────────

/**
 * Push-Token mit Telefonnummer verknüpfen (HofSpot v2.0).
 * Muss beim App-Start aufgerufen werden, nachdem Push-Berechtigung erteilt wurde.
 * Ersetzt den bisherigen direkten Datenbank-Zugriff.
 */
export async function registrierePushToken(telefon: string, pushToken: string): Promise<void> {
  await batchPost<{ success: boolean }>("hofmarkt.registrierePushToken", { telefon, pushToken });
}
