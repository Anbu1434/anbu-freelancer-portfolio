import { beforeAll, describe, expect, it, vi } from "vitest";
import { login } from "@/app/admin/login/actions";
import { hashPassword } from "@/lib/auth/password";

let passwordHash = "";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/request", () => ({ clientIp: vi.fn(async () => "203.0.113.7") }));
vi.mock("@/lib/auth/session-cookie", () => ({ setSessionCookie: vi.fn(async () => {}) }));
vi.mock("@/lib/db/admins", () => ({
  findAdminByEmail: vi.fn(async (email: string) =>
    email === "me@example.com" ? { id: "a1", email, passwordHash, sessionVersion: 1 } : null,
  ),
}));

beforeAll(async () => {
  passwordHash = await hashPassword("correct-horse-battery");
});

function form(email: string, password: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe("login", () => {
  it("keeps letting the admin in after many successful sign-ins from one IP", async () => {
    for (let i = 0; i < 8; i++) {
      await expect(login(undefined, form("me@example.com", "correct-horse-battery"))).rejects.toThrow("NEXT_REDIRECT");
    }
  });

  it("returns the same error for an unknown email and a wrong password", async () => {
    const unknown = await login(undefined, form("nobody@example.com", "whatever"));
    const wrong = await login(undefined, form("me@example.com", "wrong"));
    expect(unknown?.error).toBe("Invalid email or password.");
    expect(wrong?.error).toBe(unknown?.error);
  });
});
