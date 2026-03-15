/**
 * Gartenglück – Warenkorb-State
 * Pro Hof ein eigener Warenkorb (userId als Schlüssel).
 * Wird im React-Context gehalten, kein AsyncStorage (flüchtig).
 */

import { createContext, useContext } from "react";
import type { HofProdukt } from "./hofmarkt-api";

export interface WarenkorbPosition {
  produkt: HofProdukt;
  menge: number;
}

export interface Warenkorb {
  hofUserId: number;
  hofName: string;
  positionen: WarenkorbPosition[];
}

export interface WarenkorbState {
  warenkorb: Warenkorb | null;
  gesamtpreis: number;
  gesamtAnzahl: number;
  setzeHof: (hofUserId: number, hofName: string) => void;
  setze: (produkt: HofProdukt, menge: number) => void;
  erhoehe: (produktId: string) => void;
  verringere: (produktId: string) => void;
  entferne: (produktId: string) => void;
  leere: () => void;
}

export const WarenkorbContext = createContext<WarenkorbState>({
  warenkorb: null,
  gesamtpreis: 0,
  gesamtAnzahl: 0,
  setzeHof: () => {},
  setze: () => {},
  erhoehe: () => {},
  verringere: () => {},
  entferne: () => {},
  leere: () => {},
});

export function useWarenkorb(): WarenkorbState {
  return useContext(WarenkorbContext);
}

/** Gesamtpreis eines Warenkorbs berechnen */
export function berechneGesamtpreis(positionen: WarenkorbPosition[]): number {
  return positionen.reduce((sum, pos) => {
    const preis = parseFloat(pos.produkt.preis ?? "0");
    return sum + preis * pos.menge;
  }, 0);
}
