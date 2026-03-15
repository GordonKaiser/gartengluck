// Shared types for Hofmarkt App

export interface HofSucheErgebnis {
  id: number;
  userId: number;
  hofName: string;
  plz: string | null;
  ort: string | null;
  lat?: string | null;
  lon?: string | null;
  beschreibung: string | null;
  shopLink: string | null;
  distanzKm: number;
  module: {
    gefluegel: boolean;
    imkerei: boolean;
    pilze: boolean;
    garten: boolean;
    holz: boolean;
  };
}

export interface HofProdukt {
  kategorie: "gefluegel" | "imkerei" | "pilze" | "garten" | "holz";
  name: string;
  emoji: string;
  preis: string | null;
  einheit: string;
  verfuegbar: boolean;
  vorbestellungDatum: string | null;
}

export const MODUL_LABELS: Record<string, string> = {
  gefluegel: "Geflügel",
  imkerei: "Imkerei",
  pilze: "Pilze",
  garten: "Garten",
  holz: "Holz",
};

export const MODUL_EMOJIS: Record<string, string> = {
  gefluegel: "🐔",
  imkerei: "🍯",
  pilze: "🍄",
  garten: "🥦",
  holz: "🪵",
};

export const RADIUS_OPTIONEN = [10, 25, 50] as const;
export type RadiusOption = (typeof RADIUS_OPTIONEN)[number];
