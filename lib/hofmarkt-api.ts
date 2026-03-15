/**
 * Gartenglück – API-Client für die Hobbyanbau Suite
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
 */
export async function suchHoefe(
  plz: string,
  umkreisKm: number,
  kategorien?: Kategorie[]
): Promise<HofSucheErgebnis[]> {
  const input: Record<string, unknown> = { plz, umkreisKm };
  if (kategorien && kategorien.length > 0) {
    input.kategorien = kategorien;
  }
  return batchGet<HofSucheErgebnis[]>("hofmarkt.suche", input);
}

/**
 * Alle Produkte eines Hofes abrufen.
 * @param userId  userId des Hofes (aus der Suche)
 */
export async function ladeHofProdukte(userId: number): Promise<HofProdukteAntwort> {
  return batchGet<HofProdukteAntwort>("hofmarkt.produkte", { userId });
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

/** Kategorie-Metadaten */
export const KATEGORIEN: { id: Kategorie; label: string; emoji: string }[] = [
  { id: "eier",      label: "Eier",     emoji: "🥚" },
  { id: "gefluegel", label: "Geflügel", emoji: "🐓" },
  { id: "pilze",     label: "Pilze",    emoji: "🍄" },
  { id: "imkerei",   label: "Imkerei",  emoji: "🍯" },
  { id: "garten",    label: "Garten",   emoji: "🌱" },
  { id: "holz",      label: "Holz",     emoji: "🪵" },
];

export const KATEGORIE_MAP = Object.fromEntries(
  KATEGORIEN.map((k) => [k.id, k])
) as Record<Kategorie, { id: Kategorie; label: string; emoji: string }>;
