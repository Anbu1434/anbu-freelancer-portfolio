import { SignJWT } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

const secret = "x".repeat(40);

beforeEach(() => {
  process.env.SESSION_SECRET = secret;
});

describe("session tokens", () => {
  it("round-trips the payload", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 3 });
    expect(await verifySession(token)).toEqual({ adminId: "a1", sessionVersion: 3 });
  });

  it("rejects missing, tampered and foreign-key tokens", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 1 });
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession(`${token.slice(0, -2)}xx`)).toBeNull();
    process.env.SESSION_SECRET = "y".repeat(40);
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const expired = await new SignJWT({ adminId: "a1", sessionVersion: 1 })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(0)
      .setExpirationTime(1)
      .sign(new TextEncoder().encode(secret));
    expect(await verifySession(expired)).toBeNull();
  });

  it("refuses to sign with a short secret", async () => {
    process.env.SESSION_SECRET = "short";
    await expect(signSession({ adminId: "a1", sessionVersion: 1 })).rejects.toThrow(/SESSION_SECRET/);
  });
});
