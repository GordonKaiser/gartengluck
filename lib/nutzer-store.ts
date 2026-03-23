/**
 * LocaBuy – Nutzer-Store
 * Speichert das registrierte Nutzerprofil lokal in AsyncStorage.
 * Kein Passwort, kein OAuth — Identität = Telefonnummer.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const NUTZER_KEY = "gartengluck_nutzer_profil";

export interface NutzerProfil {
  id: number;
  telefon: string;
  email?: string | null;
  name: string;
  strasse: string | null;
  ort: string | null;
  plz: string | null;
  profilbildUrl?: string | null;
  pushBenachrichtigungen?: boolean;
  gesperrt: boolean;
}

/** Gespeichertes Profil laden (null wenn nicht registriert). */
export async function ladeNutzerProfil(): Promise<NutzerProfil | null> {
  try {
    const raw = await AsyncStorage.getItem(NUTZER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NutzerProfil;
  } catch {
    return null;
  }
}

/** Profil nach Registrierung lokal speichern. */
export async function speichereNutzerProfil(profil: NutzerProfil): Promise<void> {
  await AsyncStorage.setItem(NUTZER_KEY, JSON.stringify(profil));
}

/** Profil löschen (Abmelden). */
export async function loescheNutzerProfil(): Promise<void> {
  await AsyncStorage.removeItem(NUTZER_KEY);
}

// ── Push-Token ──────────────────────────────────────────────────────────────

const PUSH_TOKEN_KEY = "locabuy_push_token";

/** Eigenen Expo Push-Token lokal speichern (wird beim Bestellvorgang mitgesendet). */
export async function speicherePushToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch {
    // Ignorieren
  }
}

/** Gespeicherten Push-Token laden (null wenn nicht vorhanden). */
export async function ladePushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

const BEWERTUNGEN_KEY = "locabuy_bewertungen_abgegeben";

/** Bestellindex als bewertet markieren (lokal gespeichert). */
export async function markiereBewertungAbgegeben(bestellIndex: number): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BEWERTUNGEN_KEY);
    const liste: number[] = raw ? JSON.parse(raw) : [];
    if (!liste.includes(bestellIndex)) {
      liste.push(bestellIndex);
      await AsyncStorage.setItem(BEWERTUNGEN_KEY, JSON.stringify(liste));
    }
  } catch {
    // Fehler ignorieren – Bewertung wurde bereits gesendet
  }
}

/** Prüfen ob eine Bestellung bereits bewertet wurde. */
export async function istBewertungAbgegeben(bestellIndex: number): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(BEWERTUNGEN_KEY);
    const liste: number[] = raw ? JSON.parse(raw) : [];
    return liste.includes(bestellIndex);
  } catch {
    return false;
  }
}

// ── Bestellhistorie ──────────────────────────────────────────────────────────

const BESTELLHISTORIE_KEY = "gartengluck_bestellhistorie";

export interface BestellHistorieEintrag {
  id: number;           // bestellId vom Server
  hofName: string;
  hofUserId: number;
  produkte: Array<{
    name: string;
    menge: number;
    preis: string;
    einheit: string;
  }>;
  status: string;       // "neu" | "bestaetigt" | "bereit" | "abgeholt" | "storniert" | "abgelehnt"
  kundeTelefon: string;
  gesamtpreis?: number;
  datum: string;        // ISO-Datum der Bestellung
  abholdatum?: string;  // Optionales Abholdatum vom Hof (aus Push-Payload)
}

/** Alle gespeicherten Bestellungen laden (neueste zuerst). */
export async function ladeBestellHistorie(): Promise<BestellHistorieEintrag[]> {
  try {
    const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
    if (!raw) return [];
    const liste = JSON.parse(raw) as BestellHistorieEintrag[];
    // Neueste zuerst
    return liste.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  } catch {
    return [];
  }
}

/** Neue Bestellung in die lokale Historie speichern. */
export async function speichereBestellungInHistorie(eintrag: BestellHistorieEintrag): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
    const liste: BestellHistorieEintrag[] = raw ? JSON.parse(raw) : [];
    // Doppelte vermeiden (gleiche ID)
    const gefiltert = liste.filter((e) => e.id !== eintrag.id);
    gefiltert.push(eintrag);
    await AsyncStorage.setItem(BESTELLHISTORIE_KEY, JSON.stringify(gefiltert));
  } catch {
    // Ignorieren – Bestellung wurde bereits gesendet
  }
}

/** Status einer Bestellung in der lokalen Historie aktualisieren. */
export async function aktualisiereBestellStatusInHistorie(bestellId: number, neuerStatus: string, abholdatum?: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(BESTELLHISTORIE_KEY);
    if (!raw) return;
    const liste: BestellHistorieEintrag[] = JSON.parse(raw);
    let geaendert = false;
    for (const eintrag of liste) {
      if (eintrag.id === bestellId) {
        eintrag.status = neuerStatus;
        if (abholdatum) eintrag.abholdatum = abholdatum;
        geaendert = true;
      }
    }
    if (geaendert) {
      await AsyncStorage.setItem(BESTELLHISTORIE_KEY, JSON.stringify(liste));
    }
  } catch {
    // Ignorieren
  }
}

// ── Geräte-ID ──────────────────────────────────────────────────────────────────

const GERAETE_ID_KEY = "locabuy_geraete_id";

/**
 * Gibt die einmalige Geräte-ID zurück.
 * Wird beim ersten Aufruf generiert und sicher im Keychain gespeichert.
 * Auf Web: AsyncStorage als Fallback.
 */
export async function ladeOderErstelleGeraeteId(): Promise<string> {
  try {
    // Zuerst aus SecureStore laden (iOS/Android Keychain)
    const gespeichert = await SecureStore.getItemAsync(GERAETE_ID_KEY);
    if (gespeichert) return gespeichert;
    // Neue UUID generieren
    const neueId = Crypto.randomUUID();
    await SecureStore.setItemAsync(GERAETE_ID_KEY, neueId);
    return neueId;
  } catch {
    // Web-Fallback: AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(GERAETE_ID_KEY);
      if (raw) return raw;
      const neueId = Crypto.randomUUID();
      await AsyncStorage.setItem(GERAETE_ID_KEY, neueId);
      return neueId;
    } catch {
      return Crypto.randomUUID();
    }
  }
}
