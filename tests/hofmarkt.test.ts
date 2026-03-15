import { describe, it, expect } from "vitest";
import { MODUL_EMOJIS, MODUL_LABELS, RADIUS_OPTIONEN } from "../shared/hofmarkt-types";

// ── Shared Types Tests ────────────────────────────────────────

describe("MODUL_LABELS", () => {
  it("enthält alle fünf Module", () => {
    expect(MODUL_LABELS.gefluegel).toBe("Geflügel");
    expect(MODUL_LABELS.imkerei).toBe("Imkerei");
    expect(MODUL_LABELS.pilze).toBe("Pilze");
    expect(MODUL_LABELS.garten).toBe("Garten");
    expect(MODUL_LABELS.holz).toBe("Holz");
  });
});

describe("MODUL_EMOJIS", () => {
  it("enthält Emojis für alle Module", () => {
    expect(MODUL_EMOJIS.gefluegel).toBe("🐔");
    expect(MODUL_EMOJIS.imkerei).toBe("🍯");
    expect(MODUL_EMOJIS.pilze).toBe("🍄");
    expect(MODUL_EMOJIS.garten).toBe("🥦");
    expect(MODUL_EMOJIS.holz).toBe("🪵");
  });
});

describe("RADIUS_OPTIONEN", () => {
  it("enthält genau 10, 25 und 50 km", () => {
    expect(RADIUS_OPTIONEN).toEqual([10, 25, 50]);
  });
});

// ── Distanz-Hilfsfunktion ─────────────────────────────────────

function formatDistanz(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

describe("formatDistanz", () => {
  it("zeigt Meter unter 1 km", () => {
    expect(formatDistanz(0.5)).toBe("500 m");
    expect(formatDistanz(0.123)).toBe("123 m");
  });

  it("zeigt Kilometer ab 1 km", () => {
    expect(formatDistanz(1.0)).toBe("1.0 km");
    expect(formatDistanz(12.567)).toBe("12.6 km");
  });

  it("zeigt 0 Meter für exakt 0", () => {
    expect(formatDistanz(0)).toBe("0 m");
  });
});

// ── Verfügbarkeits-Badge-Logik ────────────────────────────────

function getVerfuegbarText(verfuegbar: boolean, vorbestellungDatum: string | null): string {
  if (verfuegbar) return "Verfügbar";
  if (vorbestellungDatum) return `ab ${vorbestellungDatum}`;
  return "Vorbestellung";
}

describe("getVerfuegbarText", () => {
  it("zeigt 'Verfügbar' wenn verfügbar", () => {
    expect(getVerfuegbarText(true, null)).toBe("Verfügbar");
    expect(getVerfuegbarText(true, "2026-04-01")).toBe("Verfügbar");
  });

  it("zeigt Datum wenn nicht verfügbar aber Datum vorhanden", () => {
    expect(getVerfuegbarText(false, "2026-04-01")).toBe("ab 2026-04-01");
  });

  it("zeigt 'Vorbestellung' wenn nicht verfügbar und kein Datum", () => {
    expect(getVerfuegbarText(false, null)).toBe("Vorbestellung");
  });
});

// ── PLZ-Validierung ───────────────────────────────────────────

function isValidPlz(plz: string): boolean {
  return /^\d{4,5}$/.test(plz.trim());
}

describe("isValidPlz", () => {
  it("akzeptiert gültige deutsche PLZ", () => {
    expect(isValidPlz("10115")).toBe(true);
    expect(isValidPlz("80331")).toBe(true);
    expect(isValidPlz("1234")).toBe(true); // 4-stellig (Österreich)
  });

  it("lehnt ungültige PLZ ab", () => {
    expect(isValidPlz("123")).toBe(false);
    expect(isValidPlz("123456")).toBe(false);
    expect(isValidPlz("abcde")).toBe(false);
    expect(isValidPlz("")).toBe(false);
  });
});

// ── Preis-Formatierung ────────────────────────────────────────

function formatPreis(preis: string | null, einheit: string): string {
  if (!preis) return "Preis auf Anfrage";
  const num = parseFloat(preis);
  return `${num.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} / ${einheit}`;
}

describe("formatPreis", () => {
  it("formatiert Preis korrekt", () => {
    const result = formatPreis("0.40", "Stück");
    expect(result).toContain("Stück");
    expect(result).toContain("0,40");
  });

  it("zeigt Fallback bei null", () => {
    expect(formatPreis(null, "kg")).toBe("Preis auf Anfrage");
  });
});
