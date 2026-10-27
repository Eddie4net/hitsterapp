import { describe, expect, it } from "vitest";
import { challengeFor, randomString } from "./pkce";

describe("PKCE", () => {
  it("rekent de code challenge uit volgens het voorbeeld uit RFC 7636", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(await challengeFor(verifier)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("maakt een willekeurige verifier met alleen toegestane tekens", () => {
    const a = randomString(64);
    const b = randomString(64);
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(a).not.toBe(b);
  });
});
