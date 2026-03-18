import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Hof-Profil (für Hofmarkt-Plattform) ────────────────────
export const hofProfile = mysqlTable("hof_profile", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  hofName: varchar("hof_name", { length: 200 }).notNull().default(""),
  plz: varchar("plz", { length: 10 }),
  ort: varchar("ort", { length: 100 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lon: decimal("lon", { precision: 10, scale: 7 }),
  beschreibung: text("beschreibung"),
  aktiv: boolean("aktiv").notNull().default(true),
  shopLink: varchar("shop_link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type HofProfil = typeof hofProfile.$inferSelect;
export type InsertHofProfil = typeof hofProfile.$inferInsert;

// ── Abonnements / Modul-Freischaltung ────────────────────────
export const abonnements = mysqlTable("abonnements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  modulGefluegel: boolean("modul_gefluegel").notNull().default(true),
  modulImkerei: boolean("modul_imkerei").notNull().default(false),
  modulPilze: boolean("modul_pilze").notNull().default(false),
  modulGarten: boolean("modul_garten").notNull().default(false),
  modulHolz: boolean("modul_holz").notNull().default(false),
  status: mysqlEnum("status", ["trial", "aktiv", "gekuendigt", "abgelaufen"]).notNull().default("trial"),
  trialEnde: timestamp("trial_ende"),
  periodeEnde: timestamp("periode_ende"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 200 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Abonnement = typeof abonnements.$inferSelect;
export type InsertAbonnement = typeof abonnements.$inferInsert;

// ── PLZ-Koordinaten (Deutschland) ────────────────────────────
export const plzKoordinaten = mysqlTable("plz_koordinaten", {
  id: int("id").autoincrement().primaryKey(),
  plz: varchar("plz", { length: 10 }).notNull(),
  ort: varchar("ort", { length: 200 }).notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }).notNull(),
  lon: decimal("lon", { precision: 10, scale: 7 }).notNull(),
});
export type PlzKoordinate = typeof plzKoordinaten.$inferSelect;

// ── Shop-Einstellungen (für Produkt-Aggregation) ──────────────
export const shopEinstellungen = mysqlTable("shop_einstellungen", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  preisEierHuhn: decimal("preisEierHuhn", { precision: 10, scale: 2 }).default("0.40"),
  preisEierEnte: decimal("preisEierEnte", { precision: 10, scale: 2 }).default("0.50"),
  preisBrutHuhn: decimal("preisBrutHuhn", { precision: 10, scale: 2 }).default("1.50"),
  preisBrutEnte: decimal("preisBrutEnte", { precision: 10, scale: 2 }).default("2.00"),
  preisKuekenHuhn: decimal("preisKuekenHuhn", { precision: 10, scale: 2 }).default("5.00"),
  preisKuekenEnte: decimal("preisKuekenEnte", { precision: 10, scale: 2 }).default("6.00"),
  eierHuhnVerfuegbar: boolean("eierHuhnVerfuegbar").notNull().default(true),
  eierEnteVerfuegbar: boolean("eierEnteVerfuegbar").notNull().default(true),
  brutHuhnVerfuegbar: boolean("brutHuhnVerfuegbar").notNull().default(false),
  brutEnteVerfuegbar: boolean("brutEnteVerfuegbar").notNull().default(false),
  kuekenHuhnVerfuegbar: boolean("kuekenHuhnVerfuegbar").notNull().default(false),
  kuekenEnteVerfuegbar: boolean("kuekenEnteVerfuegbar").notNull().default(false),
  honigShopAktiv: boolean("honigShopAktiv").notNull().default(false),
  wachsShopAktiv: boolean("wachsShopAktiv").notNull().default(false),
  pollenShopAktiv: boolean("pollenShopAktiv").notNull().default(false),
  rosenseitlingShopAktiv: boolean("rosenseitlingShopAktiv").notNull().default(false),
  zitronenseitlingShopAktiv: boolean("zitronenseitlingShopAktiv").notNull().default(false),
  kraeuterseitlingShopAktiv: boolean("kraeuterseitlingShopAktiv").notNull().default(false),
  austernpilzShopAktiv: boolean("austernpilzShopAktiv").notNull().default(false),
  gartenShopAktiv: boolean("gartenShopAktiv").notNull().default(false),
  holzShopAktiv: boolean("holzShopAktiv").notNull().default(false),
  shopName: varchar("shopName", { length: 200 }).default("Hobbyanbau Suite"),
  shopBeschreibung: text("shopBeschreibung"),
  abholhinweis: text("abholhinweis"),
  hofWhatsapp: varchar("hofWhatsapp", { length: 50 }),
  modulGefluegelAktiv: boolean("modulGefluegelAktiv").notNull().default(true),
  modulImkereiAktiv: boolean("modulImkereiAktiv").notNull().default(false),
  modulGartenAktiv: boolean("modulGartenAktiv").notNull().default(false),
  modulPilzeAktiv: boolean("modulPilzeAktiv").notNull().default(false),
  modulHolzAktiv: boolean("modulHolzAktiv").notNull().default(false),
  vorbestellungEierHuhnDatum: varchar("vorbestellungEierHuhnDatum", { length: 100 }),
  vorbestellungEierEnteDatum: varchar("vorbestellungEierEnteDatum", { length: 100 }),
  vorbestellungHonigDatum: varchar("vorbestellungHonigDatum", { length: 100 }),
  vorbestellungPilzeDatum: varchar("vorbestellungPilzeDatum", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShopEinstellungen = typeof shopEinstellungen.$inferSelect;

// ── Eier-Bestand ─────────────────────────────────────────────
export const eierBestand = mysqlTable("eier_bestand", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  bestandHuhn: int("bestandHuhn").notNull().default(0),
  bestandEnte: int("bestandEnte").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Pilz-Bestand ─────────────────────────────────────────────
export const pilzBestand = mysqlTable("pilz_bestand", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  bestandRosenseitling: int("bestandRosenseitling").notNull().default(0),
  bestandZitronenseitling: int("bestandZitronenseitling").notNull().default(0),
  bestandKraeuterseitling: int("bestandKraeuterseitling").notNull().default(0),
  bestandAusternseitling: int("bestandAusternseitling").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Imkerei-Einstellungen ─────────────────────────────────────
export const imkerEinstellungen = mysqlTable("imker_einstellungen", {
  userId: int("user_id").primaryKey(),
  honigPreisProKg: decimal("honig_preis_pro_kg", { precision: 8, scale: 2 }).default("12.00"),
  honigVerfuegbarKg: decimal("honig_verfuegbar_kg", { precision: 10, scale: 3 }).default("0"),
  honigAktiv: boolean("honig_aktiv").default(false),
  wachsPreisPro100g: decimal("wachs_preis_pro_100g", { precision: 8, scale: 2 }).default("8.00"),
  wachsVerfuegbarGramm: int("wachs_verfuegbar_gramm").default(0),
  wachsAktiv: boolean("wachs_aktiv").default(false),
  pollenPreisProKg: decimal("pollen_preis_pro_kg", { precision: 8, scale: 2 }).default("25.00"),
  pollenVerfuegbarGramm: int("pollen_verfuegbar_gramm").default(0),
  pollenAktiv: boolean("pollen_aktiv").default(false),
  verfuegbarAbHonig: varchar("verfuegbar_ab_honig", { length: 10 }),
  verfuegbarAbWachs: varchar("verfuegbar_ab_wachs", { length: 10 }),
  verfuegbarAbPollen: varchar("verfuegbar_ab_pollen", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ── Garten-Produkte ───────────────────────────────────────────
export const gartenProdukte = mysqlTable("garten_produkte", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull().default("🌱"),
  einheit: varchar("einheit", { length: 20 }).notNull().default("kg"),
  preisProEinheit: decimal("preis_pro_einheit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  verfuegbar: boolean("verfuegbar").notNull().default(true),
  userId: int("user_id"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Holz-Produkte ─────────────────────────────────────────────
export const holzProdukte = mysqlTable("holz_produkte", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  emoji: varchar("emoji", { length: 10 }).notNull().default("🪵"),
  einheit: varchar("einheit", { length: 20 }).notNull().default("rm"),
  preisProEinheit: decimal("preis_pro_einheit", { precision: 10, scale: 2 }).notNull().default("0.00"),
  verfuegbar: boolean("verfuegbar").notNull().default(true),
  userId: int("user_id"),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ── Gartenglück-Nutzer (App 2 – Käufer-Registrierung) ───────────
export const gartengluckNutzer = mysqlTable("gartengluck_nutzer", {
  id: int("id").autoincrement().primaryKey(),
  telefon: varchar("telefon", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  strasse: varchar("strasse", { length: 200 }),
  ort: varchar("ort", { length: 100 }),
  plz: varchar("plz", { length: 10 }),
  pushToken: varchar("push_token", { length: 500 }),
  gesperrt: boolean("gesperrt").notNull().default(false),
  sperrGrund: text("sperr_grund"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GartengluckNutzer = typeof gartengluckNutzer.$inferSelect;
export type InsertGartengluckNutzer = typeof gartengluckNutzer.$inferInsert;

// ── Referral-System (LocaBuy) ───────────────────────────────────
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ReferralCode = typeof referralCodes.$inferSelect;

export const referralRewards = mysqlTable("referral_rewards", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrer_id").notNull(),
  referredId: int("referred_id").notNull().unique(),
  eingeloest: boolean("eingeloest").notNull().default(false),
  eingeloestAt: timestamp("eingeloest_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ReferralReward = typeof referralRewards.$inferSelect;

// ── Pilz-Einstellungen ────────────────────────────────────────
export const pilzEinstellungen = mysqlTable("pilz_einstellungen", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  preisRosenseitling: decimal("preisRosenseitling", { precision: 10, scale: 2 }).default("3.20"),
  preisZitronenseitling: decimal("preisZitronenseitling", { precision: 10, scale: 2 }).default("3.20"),
  preisKraeuterseitling: decimal("preisKraeuterseitling", { precision: 10, scale: 2 }).default("2.50"),
  preisAusternseitling: decimal("preisAusternseitling", { precision: 10, scale: 2 }).default("2.20"),
  shopRosenseitling: boolean("shopRosenseitling").notNull().default(true),
  shopZitronenseitling: boolean("shopZitronenseitling").notNull().default(true),
  shopKraeuterseitling: boolean("shopKraeuterseitling").notNull().default(true),
  shopAusternseitling: boolean("shopAusternseitling").notNull().default(true),
  verfuegbarAbRosenseitling: varchar("verfuegbarAbRosenseitling", { length: 10 }),
  verfuegbarAbZitronenseitling: varchar("verfuegbarAbZitronenseitling", { length: 10 }),
  verfuegbarAbKraeuterseitling: varchar("verfuegbarAbKraeuterseitling", { length: 10 }),
  verfuegbarAbAusternseitling: varchar("verfuegbarAbAusternseitling", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
