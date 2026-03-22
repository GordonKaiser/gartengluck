import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  registriereNutzer,
  getNutzerByTelefon,
  getNutzerById,
  getAlleNutzer,
  sperrNutzer,
  entsperrNutzer,
  updateNutzerPushToken,
  aktualisiereNutzerProfil,
  getReferralCode,
  generateReferralCode,
  einloesenReferralCode,
  getReferralStatus,
  speichereBestellungServerSeitig,
  ladeBestellHistorieVomServer,
  aktualisiereBestellStatusServerSeitig,
} from "./db";

// Externe Hobbyanbau-Suite API
const EXTERNE_API = "https://backend-production-02ba.up.railway.app/api/trpc";

async function externeAbfrage<T>(
  endpunkt: string,
  input: Record<string, unknown>
): Promise<T> {
  const url = `${EXTERNE_API}/${endpunkt}?input=${encodeURIComponent(
    JSON.stringify({ json: input })
  )}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Externe API Fehler: ${res.status} ${res.statusText}`);
  }
  const body = await res.json();
  if (body.error) {
    throw new Error(body.error.json?.message ?? "Unbekannter API-Fehler");
  }
  return body.result.data.json as T;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Gartenglück-Nutzer-Verwaltung ─────────────────────────────────────
  nutzer: router({
    /**
     * Nutzer registrieren oder einloggen (Telefonnummer als Identität).
     * Gibt das Nutzerprofil zurück. Wenn gesperrt, wird ein Fehler geworfen.
     */
    registrieren: publicProcedure
      .input(
        z.object({
          telefon: z.string().min(6).max(30),
          email: z.string().email().optional().or(z.literal("")),
          name: z.string().min(2).max(200),
          strasse: z.string().max(200).optional(),
          ort: z.string().max(100).optional(),
          plz: z.string().max(10).optional(),
          geraeteId: z.string().max(100).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const nutzer = await registriereNutzer({
          telefon: input.telefon.trim(),
          name: input.name.trim(),
          strasse: input.strasse?.trim() ?? null,
          ort: input.ort?.trim() ?? null,
          plz: input.plz?.trim() ?? null,
          email: input.email?.trim() || null,
          geraeteId: input.geraeteId ?? null,
        } as any);
        if (!nutzer) throw new Error("Registrierung fehlgeschlagen");
        if (nutzer.gesperrt) {
          throw new Error(
            `Dein Konto wurde gesperrt.${nutzer.sperrGrund ? " Grund: " + nutzer.sperrGrund : ""}`
          );
        }
        return {
          id: nutzer.id,
          telefon: nutzer.telefon,
          email: nutzer.email ?? null,
          name: nutzer.name,
          strasse: nutzer.strasse,
          ort: nutzer.ort,
          plz: nutzer.plz,
          gesperrt: nutzer.gesperrt,
        };
      }),

    /** Eigenes Profil aktualisieren (Name, E-Mail, Adresse, Profilbild, Push-Einstellungen). */
    profilAktualisieren: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(2).max(200).optional(),
          email: z.string().email().optional().or(z.literal("")),
          strasse: z.string().max(200).optional().nullable(),
          ort: z.string().max(100).optional().nullable(),
          plz: z.string().max(10).optional().nullable(),
          profilbildUrl: z.string().max(1000).optional().nullable(),
          pushBenachrichtigungen: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...daten } = input;
        const aktuell = await aktualisiereNutzerProfil(id, {
          ...daten,
          email: daten.email?.trim() || null,
        });
        if (!aktuell) throw new Error("Profil nicht gefunden");
        return {
          id: aktuell.id,
          telefon: aktuell.telefon,
          email: aktuell.email ?? null,
          name: aktuell.name,
          strasse: aktuell.strasse,
          ort: aktuell.ort,
          plz: aktuell.plz,
          profilbildUrl: aktuell.profilbildUrl ?? null,
          pushBenachrichtigungen: aktuell.pushBenachrichtigungen ?? true,
          gesperrt: aktuell.gesperrt,
        };
      }),

    /** Profilbild hochladen (Base64-kodiert) und URL zurückgeben. */
    profilbildHochladen: publicProcedure
      .input(
        z.object({
          nutzerId: z.number(),
          bildBase64: z.string().max(5_000_000), // max ~3.7 MB Originalbild
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.bildBase64, "base64");
        const ext = input.mimeType === "image/png" ? "png" : "jpg";
        const key = `locabuy/profilbilder/${input.nutzerId}-${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await aktualisiereNutzerProfil(input.nutzerId, { profilbildUrl: url });
        return { url };
      }),

    /** Eigenes Profil per Telefonnummer abrufen (für Wiedereinstieg nach App-Neustart). */
    profil: publicProcedure
      .input(z.object({ telefon: z.string(), geraeteId: z.string().max(100).optional() }))
      .query(async ({ input }) => {
        const nutzer = await getNutzerByTelefon(input.telefon);
        if (!nutzer) return null;
        if (nutzer.gesperrt) {
          throw new Error(
            `Dein Konto wurde gesperrt.${nutzer.sperrGrund ? " Grund: " + nutzer.sperrGrund : ""}`
          );
        }
        // Geräte-ID beim Login aktualisieren (Gerätewechsel erlaubt, überschreibt alte ID)
        if (input.geraeteId && input.geraeteId !== nutzer.geraeteId) {
          await aktualisiereNutzerProfil(nutzer.id, { geraeteId: input.geraeteId } as any);
        }
        return {
          id: nutzer.id,
          telefon: nutzer.telefon,
          email: nutzer.email ?? null,
          name: nutzer.name,
          strasse: nutzer.strasse,
          ort: nutzer.ort,
          plz: nutzer.plz,
          profilbildUrl: nutzer.profilbildUrl ?? null,
          pushBenachrichtigungen: nutzer.pushBenachrichtigungen ?? true,
          gesperrt: nutzer.gesperrt,
        };
      }),

    /** Admin: Nutzer sperren. */
    sperren: publicProcedure
      .input(z.object({ id: z.number(), grund: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await sperrNutzer(input.id, input.grund);
        return { success: true };
      }),

    /** Admin: Nutzer entsperren. */
    entsperren: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await entsperrNutzer(input.id);
        return { success: true };
      }),

    /** Push-Token eines Nutzers speichern/aktualisieren. */
    pushTokenSpeichern: publicProcedure
      .input(z.object({ telefon: z.string(), pushToken: z.string() }))
      .mutation(async ({ input }) => {
        await updateNutzerPushToken(input.telefon, input.pushToken);
        return { success: true };
      }),

    /** Admin: Alle Nutzer abrufen (PIN-geschützt im Client). */
    alleNutzer: publicProcedure
      .input(z.object({ adminPin: z.string() }))
      .query(async ({ input }) => {
        const ADMIN_PIN = process.env.ADMIN_PIN ?? "1234";
        if (input.adminPin !== ADMIN_PIN) {
          throw new Error("Falscher Admin-PIN");
        }
        const nutzer = await getAlleNutzer();
        return nutzer.map((n) => ({
          id: n.id,
          telefon: n.telefon,
          name: n.name,
          strasse: n.strasse,
          ort: n.ort,
          plz: n.plz,
          gesperrt: n.gesperrt,
          sperrGrund: n.sperrGrund,
          erstelltAm: n.createdAt?.toISOString() ?? null,
        }));
      }),

    /**
     * Nutzer per Telefonnummer einloggen (Wiedereinstieg nach App-Neuinstallation).
     * Gibt das Profil zurück wenn vorhanden, sonst null.
     */
    einloggen: publicProcedure
      .input(z.object({ telefon: z.string().min(6).max(30) }))
      .mutation(async ({ input }) => {
        const nutzer = await getNutzerByTelefon(input.telefon.trim());
        if (!nutzer) return null;
        if (nutzer.gesperrt) {
          throw new Error(
            `Dein Konto wurde gesperrt.${nutzer.sperrGrund ? " Grund: " + nutzer.sperrGrund : ""}`
          );
        }
        return {
          id: nutzer.id,
          telefon: nutzer.telefon,
          email: nutzer.email ?? null,
          name: nutzer.name,
          strasse: nutzer.strasse,
          ort: nutzer.ort,
          plz: nutzer.plz,
          gesperrt: nutzer.gesperrt,
        };
      }),

    /** Referral-Code bei Registrierung generieren und optional einlösen. */
    referralBeiRegistrierung: publicProcedure
      .input(z.object({ nutzerId: z.number(), inviteCode: z.string().optional() }))
      .mutation(async ({ input }) => {
        await generateReferralCode(input.nutzerId);
        if (input.inviteCode?.trim()) {
          try {
            await einloesenReferralCode(input.inviteCode.trim(), input.nutzerId);
          } catch (_) { /* Referral optional */ }
        }
        return { success: true };
      }),
  }),

  // ── Referral-System ───────────────────────────────────────────────────
  referral: router({
    /** Eigenen Referral-Code abrufen (wird automatisch generiert falls nicht vorhanden). */
    meinCode: publicProcedure
      .input(z.object({ nutzerId: z.number() }))
      .query(async ({ input }) => {
        let code = await getReferralCode(input.nutzerId);
        if (!code) code = await generateReferralCode(input.nutzerId);
        return { code };
      }),

    /** Referral-Status: Anzahl Einladungen, Badge, Wunschliste freigeschaltet. */
    meinStatus: publicProcedure
      .input(z.object({ nutzerId: z.number() }))
      .query(async ({ input }) => {
        return await getReferralStatus(input.nutzerId);
      }),

    /** Einladungscode einlösen. */
    codeEinloesen: publicProcedure
      .input(z.object({ code: z.string().min(3).max(20), nutzerId: z.number() }))
      .mutation(async ({ input }) => {
        await einloesenReferralCode(input.code, input.nutzerId);
        return { success: true };
      }),
  }),

  hofmarkt: router({
    /**
     * PLZ-Umkreissuche — Proxy zur externen API.
     * Die externe API gibt: userId, hofName, plz, ort, beschreibung, shopLink, distanzKm
     */
    suche: publicProcedure
      .input(
        z.object({
          plz: z.string().min(4).max(10),
          radiusKm: z.number().int().min(1).max(200).default(25),
        })
      )
      .query(async ({ input }) => {
        try {
          const hoefen = await externeAbfrage<Array<{
            userId: number;
            hofName: string;
            plz: string | null;
            ort: string | null;
            beschreibung: string | null;
            shopLink: string | null;
            distanzKm: number;
          }>>("hofmarkt.suche", { plz: input.plz, radiusKm: input.radiusKm });

          // Felder normalisieren damit die App-Typen passen
          const normalisiert = hoefen.map((h, idx) => ({
            id: idx + 1, // Fallback-ID (externe API liefert keine id in suche)
            userId: h.userId,
            hofName: h.hofName,
            plz: h.plz,
            ort: h.ort,
            beschreibung: h.beschreibung,
            shopLink: h.shopLink,
            distanzKm: h.distanzKm,
            module: {
              gefluegel: true,  // Standardmäßig aktiv (externe API liefert keine Module)
              imkerei: false,
              pilze: false,
              garten: false,
              holz: false,
            },
          }));

          return {
            hoefen: normalisiert,
            sucheOrt: input.plz,
            suchePlz: input.plz,
            fehler: null,
          };
        } catch (err: any) {
          throw new Error(err.message ?? "Suche fehlgeschlagen");
        }
      }),

    /**
     * Öffentliches Hof-Profil — Proxy zur externen API.
     * Parameter: userId (nicht hofId)
     */
    hofProfil: publicProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
        })
      )
      .query(async ({ input }) => {
        try {
          const profil = await externeAbfrage<{
            id: number;
            userId: number;
            hofName: string;
            plz: string | null;
            ort: string | null;
            lat: string | null;
            lon: string | null;
            beschreibung: string | null;
            aktiv: boolean;
            shopLink: string | null;
            createdAt: string;
            updatedAt: string;
          }>("hofmarkt.hofProfil", { userId: input.userId });
          return profil;
        } catch (err: any) {
          return null;
        }
      }),

    /**
     * Produkte eines Hofes — externe API hat diesen Endpunkt noch nicht.
     * Gibt vorerst eine leere Liste zurück (wird ergänzt sobald verfügbar).
     */
    hofProdukte: publicProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async () => {
        // hofmarkt.hofProdukte ist in der externen API noch nicht implementiert.
        // Sobald verfügbar: externeAbfrage("hofmarkt.hofProdukte", { userId: input.userId })
        return [];
      }),
  }),

  // ── LocaBuy Bestellhistorie (server-seitig) ────────────────────
  bestellhistorie: router({
    /** Neue Bestellung in der server-seitigen Historie speichern. */
    speichern: publicProcedure
      .input(z.object({
        nutzerId: z.number().int().positive(),
        bestellId: z.number().int().positive(),
        hofName: z.string().min(1).max(200),
        hofUserId: z.number().int().positive(),
        produkte: z.array(z.object({
          name: z.string(),
          menge: z.number(),
          preis: z.string(),
          einheit: z.string(),
        })),
        status: z.string().default("neu"),
        kundenTelefon: z.string().min(6).max(30),
        gesamtpreis: z.number().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await speichereBestellungServerSeitig({
          nutzerId: input.nutzerId,
          bestellId: input.bestellId,
          hofName: input.hofName,
          hofUserId: input.hofUserId,
          produkte: input.produkte,
          status: input.status,
          kundenTelefon: input.kundenTelefon,
          gesamtpreis: input.gesamtpreis ?? null,
        });
        return { success: true };
      }),

    /** Bestellhistorie eines Nutzers laden. */
    laden: publicProcedure
      .input(z.object({ nutzerId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return await ladeBestellHistorieVomServer(input.nutzerId);
      }),

    /** Status einer Bestellung aktualisieren. */
    statusAktualisieren: publicProcedure
      .input(z.object({
        bestellId: z.number().int().positive(),
        neuerStatus: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await aktualisiereBestellStatusServerSeitig(input.bestellId, input.neuerStatus);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
