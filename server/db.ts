import { and, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  hofProfile,
  abonnements,
  plzKoordinaten,
  shopEinstellungen,
  eierBestand,
  pilzBestand,
  pilzEinstellungen,
  imkerEinstellungen,
  gartenProdukte,
  holzProdukte,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field]; if (value === undefined) return;
      const normalized = value ?? null; values[field] = normalized; updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── PLZ-Koordinaten ───────────────────────────────────────────

export async function getPlzKoordinaten(plz: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(plzKoordinaten)
    .where(eq(plzKoordinaten.plz, plz))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ── Hofmarkt: Umkreissuche ────────────────────────────────────

export interface HofSucheErgebnis {
  id: number;
  userId: number;
  hofName: string;
  plz: string | null;
  ort: string | null;
  lat: string | null;
  lon: string | null;
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

export async function sucheHoefeImUmkreis(
  lat0: number,
  lon0: number,
  radiusKm: number
): Promise<HofSucheErgebnis[]> {
  const db = await getDb();
  if (!db) return [];

  // Haversine-Formel direkt in SQL
  const rows = await db.execute(sql`
    SELECT
      h.id,
      h.user_id AS userId,
      h.hof_name AS hofName,
      h.plz,
      h.ort,
      h.lat,
      h.lon,
      h.beschreibung,
      h.shop_link AS shopLink,
      (6371 * ACOS(
        COS(RADIANS(${lat0})) * COS(RADIANS(h.lat)) *
        COS(RADIANS(h.lon) - RADIANS(${lon0})) +
        SIN(RADIANS(${lat0})) * SIN(RADIANS(h.lat))
      )) AS distanzKm,
      COALESCE(a.modul_gefluegel, 1) AS modulGefluegel,
      COALESCE(a.modul_imkerei, 0) AS modulImkerei,
      COALESCE(a.modul_pilze, 0) AS modulPilze,
      COALESCE(a.modul_garten, 0) AS modulGarten,
      COALESCE(a.modul_holz, 0) AS modulHolz
    FROM hof_profile h
    LEFT JOIN abonnements a ON a.user_id = h.user_id
    WHERE h.aktiv = 1
      AND h.lat IS NOT NULL
      AND h.lon IS NOT NULL
      AND (a.status IN ('trial', 'aktiv') OR a.status IS NULL)
    HAVING distanzKm <= ${radiusKm}
    ORDER BY distanzKm ASC
    LIMIT 50
  `);

  const data = (rows as any)[0] as any[];
  return data.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    hofName: row.hofName,
    plz: row.plz,
    ort: row.ort,
    lat: row.lat,
    lon: row.lon,
    beschreibung: row.beschreibung,
    shopLink: row.shopLink,
    distanzKm: parseFloat(row.distanzKm ?? "0"),
    module: {
      gefluegel: !!row.modulGefluegel,
      imkerei: !!row.modulImkerei,
      pilze: !!row.modulPilze,
      garten: !!row.modulGarten,
      holz: !!row.modulHolz,
    },
  }));
}

// ── Hofmarkt: Hof-Profil ──────────────────────────────────────

export async function getHofProfilPublic(hofId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(hofProfile)
    .where(and(eq(hofProfile.id, hofId), eq(hofProfile.aktiv, true)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ── Hofmarkt: Produkte aggregiert ────────────────────────────

export interface HofProdukt {
  kategorie: "gefluegel" | "imkerei" | "pilze" | "garten" | "holz";
  name: string;
  emoji: string;
  preis: string | null;
  einheit: string;
  verfuegbar: boolean;
  vorbestellungDatum: string | null;
}

export async function getHofProduktePublic(userId: number): Promise<HofProdukt[]> {
  const db = await getDb();
  if (!db) return [];

  const produkte: HofProdukt[] = [];

  // Shop-Einstellungen laden
  const shopRows = await db
    .select()
    .from(shopEinstellungen)
    .where(eq(shopEinstellungen.userId, userId))
    .limit(1);
  const shop = shopRows[0] ?? null;

  // Eier-Bestand laden
  const bestandRows = await db
    .select()
    .from(eierBestand)
    .where(eq(eierBestand.userId, userId))
    .limit(1);
  const bestand = bestandRows[0] ?? null;

  if (shop) {
    // Geflügel-Produkte
    if (shop.modulGefluegelAktiv) {
      if (shop.eierHuhnVerfuegbar) {
        const hatBestand = bestand ? (bestand.bestandHuhn ?? 0) > 0 : false;
        produkte.push({
          kategorie: "gefluegel",
          name: "Hühnereier",
          emoji: "🥚",
          preis: shop.preisEierHuhn,
          einheit: "Stück",
          verfuegbar: hatBestand,
          vorbestellungDatum: hatBestand ? null : (shop.vorbestellungEierHuhnDatum ?? null),
        });
      }
      if (shop.eierEnteVerfuegbar) {
        const hatBestand = bestand ? (bestand.bestandEnte ?? 0) > 0 : false;
        produkte.push({
          kategorie: "gefluegel",
          name: "Enteneier",
          emoji: "🥚",
          preis: shop.preisEierEnte,
          einheit: "Stück",
          verfuegbar: hatBestand,
          vorbestellungDatum: hatBestand ? null : (shop.vorbestellungEierEnteDatum ?? null),
        });
      }
      if (shop.kuekenHuhnVerfuegbar) {
        produkte.push({
          kategorie: "gefluegel",
          name: "Küken (Huhn)",
          emoji: "🐣",
          preis: shop.preisKuekenHuhn,
          einheit: "Stück",
          verfuegbar: true,
          vorbestellungDatum: null,
        });
      }
      if (shop.kuekenEnteVerfuegbar) {
        produkte.push({
          kategorie: "gefluegel",
          name: "Küken (Ente)",
          emoji: "🐣",
          preis: shop.preisKuekenEnte,
          einheit: "Stück",
          verfuegbar: true,
          vorbestellungDatum: null,
        });
      }
      if (shop.brutHuhnVerfuegbar) {
        produkte.push({
          kategorie: "gefluegel",
          name: "Bruteier (Huhn)",
          emoji: "🥚",
          preis: shop.preisBrutHuhn,
          einheit: "Stück",
          verfuegbar: true,
          vorbestellungDatum: shop.vorbestellungEierHuhnDatum ?? null,
        });
      }
    }

    // Imkerei-Produkte
    if (shop.modulImkereiAktiv) {
      const imkerRows = await db
        .select()
        .from(imkerEinstellungen)
        .where(eq(imkerEinstellungen.userId, userId))
        .limit(1);
      const imker = imkerRows[0] ?? null;
      if (imker) {
        if (imker.honigAktiv) {
          const verfuegbar = parseFloat(String(imker.honigVerfuegbarKg ?? "0")) > 0;
          produkte.push({
            kategorie: "imkerei",
            name: "Honig",
            emoji: "🍯",
            preis: imker.honigPreisProKg,
            einheit: "kg",
            verfuegbar,
            vorbestellungDatum: verfuegbar ? null : (imker.verfuegbarAbHonig ?? null),
          });
        }
        if (imker.wachsAktiv) {
          const verfuegbar = (imker.wachsVerfuegbarGramm ?? 0) > 0;
          produkte.push({
            kategorie: "imkerei",
            name: "Bienenwachs",
            emoji: "🕯️",
            preis: imker.wachsPreisPro100g,
            einheit: "100g",
            verfuegbar,
            vorbestellungDatum: verfuegbar ? null : (imker.verfuegbarAbWachs ?? null),
          });
        }
        if (imker.pollenAktiv) {
          const verfuegbar = (imker.pollenVerfuegbarGramm ?? 0) > 0;
          produkte.push({
            kategorie: "imkerei",
            name: "Blütenpollen",
            emoji: "🌼",
            preis: imker.pollenPreisProKg,
            einheit: "kg",
            verfuegbar,
            vorbestellungDatum: verfuegbar ? null : (imker.verfuegbarAbPollen ?? null),
          });
        }
      }
    }

    // Pilz-Produkte
    if (shop.modulPilzeAktiv) {
      const pilzRows = await db
        .select()
        .from(pilzEinstellungen)
        .where(eq(pilzEinstellungen.userId, userId))
        .limit(1);
      const pilzEinst = pilzRows[0] ?? null;

      const pilzBestandRows = await db
        .select()
        .from(pilzBestand)
        .where(eq(pilzBestand.userId, userId))
        .limit(1);
      const pb = pilzBestandRows[0] ?? null;

      if (pilzEinst) {
        const pilzTypen = [
          { key: "Rosenseitling", emoji: "🍄", bestand: pb?.bestandRosenseitling ?? 0, preis: pilzEinst.preisRosenseitling, aktiv: pilzEinst.shopRosenseitling, verfuegbarAb: pilzEinst.verfuegbarAbRosenseitling },
          { key: "Zitronenseitling", emoji: "🍋", bestand: pb?.bestandZitronenseitling ?? 0, preis: pilzEinst.preisZitronenseitling, aktiv: pilzEinst.shopZitronenseitling, verfuegbarAb: pilzEinst.verfuegbarAbZitronenseitling },
          { key: "Kräuterseitling", emoji: "🍄", bestand: pb?.bestandKraeuterseitling ?? 0, preis: pilzEinst.preisKraeuterseitling, aktiv: pilzEinst.shopKraeuterseitling, verfuegbarAb: pilzEinst.verfuegbarAbKraeuterseitling },
          { key: "Austernpilz", emoji: "🍄", bestand: pb?.bestandAusternseitling ?? 0, preis: pilzEinst.preisAusternseitling, aktiv: pilzEinst.shopAusternseitling, verfuegbarAb: pilzEinst.verfuegbarAbAusternseitling },
        ];
        for (const p of pilzTypen) {
          if (p.aktiv) {
            const verfuegbar = p.bestand > 0;
            produkte.push({
              kategorie: "pilze",
              name: p.key,
              emoji: p.emoji,
              preis: p.preis,
              einheit: "100g",
              verfuegbar,
              vorbestellungDatum: verfuegbar ? null : (p.verfuegbarAb ?? null),
            });
          }
        }
      }
    }

    // Garten-Produkte
    if (shop.modulGartenAktiv) {
      const gartenRows = await db
        .select()
        .from(gartenProdukte)
        .where(and(eq(gartenProdukte.userId, userId), eq(gartenProdukte.verfuegbar, true)));
      for (const p of gartenRows) {
        produkte.push({
          kategorie: "garten",
          name: p.name,
          emoji: p.emoji,
          preis: p.preisProEinheit,
          einheit: p.einheit,
          verfuegbar: true,
          vorbestellungDatum: null,
        });
      }
    }

    // Holz-Produkte
    if (shop.modulHolzAktiv) {
      const holzRows = await db
        .select()
        .from(holzProdukte)
        .where(and(eq(holzProdukte.userId, userId), eq(holzProdukte.verfuegbar, true)));
      for (const p of holzRows) {
        produkte.push({
          kategorie: "holz",
          name: p.name,
          emoji: p.emoji,
          preis: p.preisProEinheit,
          einheit: p.einheit,
          verfuegbar: true,
          vorbestellungDatum: null,
        });
      }
    }
  }

  return produkte;
}
