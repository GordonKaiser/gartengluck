import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// Externe Hobbyanbau-Suite API
const EXTERNE_API = "https://gefluegel-app-ghkbktmv.manus.space/api/trpc";

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
});

export type AppRouter = typeof appRouter;
