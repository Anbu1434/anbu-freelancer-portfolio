import { describe, expect, it } from "vitest";
import { findAdminByEmail, findAdminById, updatePassword, upsertAdmin } from "@/lib/db/admins";
import { setupTestDb } from "@/test/mongo";

setupTestDb();

describe("admins repository", () => {
  it("creates an admin with a lowercased email", async () => {
    const admin = await upsertAdmin("Me@Example.com", "hash1");
    expect(admin.email).toBe("me@example.com");
    expect((await findAdminByEmail("ME@example.com"))?.id).toBe(admin.id);
  });

  it("upsert resets the password and bumps sessionVersion", async () => {
    const first = await upsertAdmin("me@example.com", "hash1");
    const second = await upsertAdmin("me@example.com", "hash2");
    expect(second.id).toBe(first.id);
    expect(second.passwordHash).toBe("hash2");
    expect(second.sessionVersion).toBe(first.sessionVersion + 1);
  });

  it("updatePassword returns the new sessionVersion", async () => {
    const admin = await upsertAdmin("me@example.com", "hash1");
    expect(await updatePassword(admin.id, "hash2")).toBe(admin.sessionVersion + 1);
    expect((await findAdminById(admin.id))?.passwordHash).toBe("hash2");
    expect(await findAdminById("bad")).toBeNull();
  });
});
