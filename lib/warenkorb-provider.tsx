/**
 * Gartenglück – WarenkorbProvider
 * Stellt den Warenkorb-State für die gesamte App bereit.
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  WarenkorbContext,
  berechneGesamtpreis,
  type Warenkorb,
  type WarenkorbPosition,
} from "./warenkorb-store";
import type { HofProdukt } from "./hofmarkt-api";

export function WarenkorbProvider({ children }: { children: React.ReactNode }) {
  const [warenkorb, setWarenkorb] = useState<Warenkorb | null>(null);

  const setzeHof = useCallback((hofUserId: number, hofName: string) => {
    setWarenkorb((prev) => {
      if (prev?.hofUserId === hofUserId) return prev;
      return { hofUserId, hofName, positionen: [] };
    });
  }, []);

  const setze = useCallback((produkt: HofProdukt, menge: number) => {
    setWarenkorb((prev) => {
      if (!prev) return prev;
      const ohneProdukt = prev.positionen.filter((p) => p.produkt.id !== produkt.id);
      const positionen: WarenkorbPosition[] =
        menge > 0 ? [...ohneProdukt, { produkt, menge }] : ohneProdukt;
      return { ...prev, positionen };
    });
  }, []);

  const erhoehe = useCallback((produktId: string) => {
    setWarenkorb((prev) => {
      if (!prev) return prev;
      const positionen = prev.positionen.map((p) =>
        p.produkt.id === produktId ? { ...p, menge: p.menge + 1 } : p
      );
      return { ...prev, positionen };
    });
  }, []);

  const verringere = useCallback((produktId: string) => {
    setWarenkorb((prev) => {
      if (!prev) return prev;
      const positionen = prev.positionen
        .map((p) => (p.produkt.id === produktId ? { ...p, menge: p.menge - 1 } : p))
        .filter((p) => p.menge > 0);
      return { ...prev, positionen };
    });
  }, []);

  const entferne = useCallback((produktId: string) => {
    setWarenkorb((prev) => {
      if (!prev) return prev;
      return { ...prev, positionen: prev.positionen.filter((p) => p.produkt.id !== produktId) };
    });
  }, []);

  const leere = useCallback(() => {
    setWarenkorb((prev) => (prev ? { ...prev, positionen: [] } : null));
  }, []);

  const gesamtpreis = useMemo(
    () => berechneGesamtpreis(warenkorb?.positionen ?? []),
    [warenkorb]
  );

  const gesamtAnzahl = useMemo(
    () => (warenkorb?.positionen ?? []).reduce((sum, p) => sum + p.menge, 0),
    [warenkorb]
  );

  return (
    <WarenkorbContext.Provider
      value={{ warenkorb, gesamtpreis, gesamtAnzahl, setzeHof, setze, erhoehe, verringere, entferne, leere }}
    >
      {children}
    </WarenkorbContext.Provider>
  );
}
