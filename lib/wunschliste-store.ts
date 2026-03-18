/**
 * Wunschliste-Store (LocaBuy)
 * Speichert gemerkte Höfe und Produkte lokal in AsyncStorage.
 * Wird nur angezeigt wenn hatWunschliste === true (ab 3 eingeladenen Freunden).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const WUNSCHLISTE_KEY = "locabuy_wunschliste";

export interface WunschlistenEintrag {
  id: string; // z.B. "hof_123" oder "produkt_123_Hühnereier"
  typ: "hof" | "produkt";
  hofUserId: number;
  hofName: string;
  produktName?: string;
  produktEmoji?: string;
  hinzugefuegtAm: string; // ISO-String
}

export async function ladeWunschliste(): Promise<WunschlistenEintrag[]> {
  try {
    const raw = await AsyncStorage.getItem(WUNSCHLISTE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function speichereWunschliste(eintraege: WunschlistenEintrag[]): Promise<void> {
  await AsyncStorage.setItem(WUNSCHLISTE_KEY, JSON.stringify(eintraege));
}

export async function aufWunschlisteSetzen(eintrag: Omit<WunschlistenEintrag, "hinzugefuegtAm">): Promise<void> {
  const liste = await ladeWunschliste();
  const exists = liste.some((e) => e.id === eintrag.id);
  if (!exists) {
    liste.unshift({ ...eintrag, hinzugefuegtAm: new Date().toISOString() });
    await speichereWunschliste(liste);
  }
}

export async function vonWunschlisteEntfernen(id: string): Promise<void> {
  const liste = await ladeWunschliste();
  await speichereWunschliste(liste.filter((e) => e.id !== id));
}

export async function istAufWunschliste(id: string): Promise<boolean> {
  const liste = await ladeWunschliste();
  return liste.some((e) => e.id === id);
}
