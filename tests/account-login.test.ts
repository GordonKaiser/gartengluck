/**
 * Tests für Account-Login und Bestellhistorie-Funktionen
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock AsyncStorage ─────────────────────────────────────────────────────────

const storage: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete storage[key]; }),
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Nutzer-Store: Profil speichern und laden", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  });

  it("speichert und lädt ein Nutzerprofil", async () => {
    const { speichereNutzerProfil, ladeNutzerProfil } = await import("../lib/nutzer-store");
    const profil = {
      id: 42,
      telefon: "+49151123456",
      name: "Max Mustermann",
      strasse: "Musterstraße 1",
      ort: "Blankenburg",
      plz: "38889",
      gesperrt: false,
    };
    await speichereNutzerProfil(profil);
    const geladen = await ladeNutzerProfil();
    expect(geladen).not.toBeNull();
    expect(geladen?.id).toBe(42);
    expect(geladen?.telefon).toBe("+49151123456");
    expect(geladen?.name).toBe("Max Mustermann");
  });

  it("gibt null zurück wenn kein Profil gespeichert", async () => {
    const { ladeNutzerProfil } = await import("../lib/nutzer-store");
    const geladen = await ladeNutzerProfil();
    expect(geladen).toBeNull();
  });

  it("löscht das Profil beim Abmelden", async () => {
    const { speichereNutzerProfil, ladeNutzerProfil, loescheNutzerProfil } = await import("../lib/nutzer-store");
    await speichereNutzerProfil({
      id: 1,
      telefon: "+49151000000",
      name: "Test",
      strasse: null,
      ort: null,
      plz: null,
      gesperrt: false,
    });
    await loescheNutzerProfil();
    const geladen = await ladeNutzerProfil();
    expect(geladen).toBeNull();
  });
});

describe("Bestellhistorie: lokal speichern und laden", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  });

  it("speichert eine Bestellung und lädt sie wieder", async () => {
    const { speichereBestellungInHistorie, ladeBestellHistorie } = await import("../lib/nutzer-store");
    const eintrag = {
      id: 100,
      hofName: "Hof Sonnenschein",
      hofUserId: 5,
      produkte: [{ name: "Hühnereier", menge: 10, preis: "0.40", einheit: "Stück" }],
      status: "neu",
      kundeTelefon: "+49151123456",
      gesamtpreis: 4.0,
      datum: new Date().toISOString(),
    };
    await speichereBestellungInHistorie(eintrag);
    const liste = await ladeBestellHistorie();
    expect(liste.length).toBe(1);
    expect(liste[0].id).toBe(100);
    expect(liste[0].hofName).toBe("Hof Sonnenschein");
    expect(liste[0].produkte[0].name).toBe("Hühnereier");
  });

  it("aktualisiert den Status einer Bestellung", async () => {
    const { speichereBestellungInHistorie, ladeBestellHistorie, aktualisiereBestellStatusInHistorie } = await import("../lib/nutzer-store");
    await speichereBestellungInHistorie({
      id: 200,
      hofName: "Hof Test",
      hofUserId: 7,
      produkte: [],
      status: "neu",
      kundeTelefon: "+49151000000",
      datum: new Date().toISOString(),
    });
    await aktualisiereBestellStatusInHistorie(200, "bestaetigt");
    const liste = await ladeBestellHistorie();
    expect(liste[0].status).toBe("bestaetigt");
  });

  it("verhindert doppelte Einträge mit gleicher ID", async () => {
    const { speichereBestellungInHistorie, ladeBestellHistorie } = await import("../lib/nutzer-store");
    const eintrag = {
      id: 300,
      hofName: "Hof Duplikat",
      hofUserId: 9,
      produkte: [],
      status: "neu",
      kundeTelefon: "+49151000000",
      datum: new Date().toISOString(),
    };
    await speichereBestellungInHistorie(eintrag);
    await speichereBestellungInHistorie({ ...eintrag, status: "bestaetigt" });
    const liste = await ladeBestellHistorie();
    expect(liste.filter((e) => e.id === 300).length).toBe(1);
    expect(liste[0].status).toBe("bestaetigt");
  });
});
