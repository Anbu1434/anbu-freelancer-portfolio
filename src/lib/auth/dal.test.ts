import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { Admin } from "@/lib/db/admins";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { resolveAdmin } = await import("@/lib/auth/dal");

const admin: Admin = { id: "a1", email: "me@example.com", passwordHash: "h", sessionVersion: 2 };
const findById = async (id: string) => (id === admin.id ? admin : null);

beforeEach(() => {
  process.env.SESSION_SECRET = "x".repeat(40);
});

describe("resolveAdmin", () => {
  it("accepts a valid token with the current session version", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 2 });
    expect(await resolveAdmin(token, findById)).toEqual({ id: "a1", email: "me@example.com" });
  });

  it("rejects a token from before the last password change", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 1 });
    expect(await resolveAdmin(token, findById)).toBeNull();
  });

  it("rejects a token for a deleted admin and a missing token", async () => {
    const token = await signSession({ adminId: "gone", sessionVersion: 2 });
    expect(await resolveAdmin(token, findById)).toBeNull();
    expect(await resolveAdmin(undefined, findById)).toBeNull();
  });
});
