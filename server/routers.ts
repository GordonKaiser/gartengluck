import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

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
     * PLZ-Umkreissuche: Gibt alle aktiven Höfe im Umkreis zurück.
     * Input: plz (5-stellig), radiusKm (10 | 25 | 50)
     */
    suche: publicProcedure
      .input(
        z.object({
          plz: z.string().min(4).max(10),
          radiusKm: z.number().int().min(1).max(200).default(25),
        })
      )
      .query(async ({ input }) => {
        const koordinaten = await db.getPlzKoordinaten(input.plz);
        if (!koordinaten) {
          return { hoefen: [], fehler: "PLZ nicht gefunden" };
        }
        const lat0 = parseFloat(String(koordinaten.lat));
        const lon0 = parseFloat(String(koordinaten.lon));
        const hoefen = await db.sucheHoefeImUmkreis(lat0, lon0, input.radiusKm);
        return {
          hoefen,
          sucheOrt: koordinaten.ort,
          suchePlz: koordinaten.plz,
          fehler: null,
        };
      }),

    /**
     * Öffentliches Hof-Profil abrufen.
     */
    hofProfil: publicProcedure
      .input(z.object({ hofId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getHofProfilPublic(input.hofId);
      }),

    /**
     * Alle Produkte eines Hofes aggregiert (aus allen Modulen).
     */
    hofProdukte: publicProcedure
      .input(z.object({ userId: z.number().int().positive() }))
      .query(async ({ input }) => {
        return db.getHofProduktePublic(input.userId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
