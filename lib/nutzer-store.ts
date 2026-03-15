/**
 * Gartenglück – Nutzer-Store
 * Speichert das registrierte Nutzerprofil lokal in AsyncStorage.
 * Kein Passwort, kein OAuth — Identität = Telefonnummer.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const NUTZER_KEY = "gartengluck_nutzer_profil";

export interface NutzerProfil {
  id: number;
  telefon: string;
  name: string;
  strasse: string | null;
  ort: string | null;
  plz: string | null;
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
