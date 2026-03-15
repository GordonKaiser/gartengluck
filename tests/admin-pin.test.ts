import { describe, it, expect } from "vitest";

describe("ADMIN_PIN Secret", () => {
  it("sollte gesetzt und mindestens 4 Zeichen lang sein", () => {
    const pin = process.env.ADMIN_PIN;
    expect(pin, "ADMIN_PIN muss gesetzt sein").toBeTruthy();
    expect(pin!.length, "ADMIN_PIN muss mindestens 4 Zeichen haben").toBeGreaterThanOrEqual(4);
  });
});
