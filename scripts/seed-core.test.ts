import { describe, expect, it } from "vitest";
import { repos } from "@/lib/db/repos";
import { findSettings } from "@/lib/db/settings";
import { setupTestDb } from "@/test/mongo";
import { seedDatabase } from "./seed-core";

setupTestDb();

describe("seedDatabase", () => {
  it("imports the current content once and skips non-empty collections after", async () => {
    const first = await seedDatabase();
    expect(Object.values(first).every((state) => state === "seeded")).toBe(true);
    expect(await repos.projects.count()).toBe(3);
    expect(await repos.services.count()).toBe(6);
    expect((await findSettings())?.brand).toBe("AnbuDev");

    const second = await seedDatabase();
    expect(Object.values(second).every((state) => state === "skipped")).toBe(true);
    expect(await repos.projects.count()).toBe(3);
  });
});
