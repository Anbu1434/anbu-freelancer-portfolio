import { describe, expect, it } from "vitest";
import { createOrderedRepo } from "@/lib/db/ordered-repo";
import { repos } from "@/lib/db/repos";
import { useTestDb } from "@/test/mongo";

useTestDb();

type Item = { title: string; note?: string };
const repo = createOrderedRepo<Item>("services");

describe("ordered repository", () => {
  it("creates items at the end and lists them in order", async () => {
    await repo.create({ title: "A" });
    await repo.create({ title: "B" });
    const items = await repo.list();
    expect(items.map((item) => item.title)).toEqual(["A", "B"]);
    expect(items[0].sortOrder).toBeLessThan(items[1].sortOrder);
    expect(typeof items[0].id).toBe("string");
    expect(typeof items[0].createdAt).toBe("string");
  });

  it("update removes cleared optional fields and keeps sortOrder", async () => {
    const id = await repo.create({ title: "A", note: "old" });
    const result = await repo.update(id, { title: "A2" });
    expect(result?.before.note).toBe("old");
    const after = await repo.get(id);
    expect(after?.title).toBe("A2");
    expect(after && "note" in after).toBe(false);
    expect(after?.sortOrder).toBe(result?.before.sortOrder);
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await repo.get("not-an-id")).toBeNull();
    expect(await repo.update("000000000000000000000000", { title: "x" })).toBeNull();
    expect(await repo.remove("nope")).toBeNull();
  });

  it("moves items up and down and stops at the ends", async () => {
    const a = await repo.create({ title: "A" });
    const b = await repo.create({ title: "B" });
    expect(await repo.move(b, "up")).toBe(true);
    expect((await repo.list()).map((item) => item.title)).toEqual(["B", "A"]);
    expect(await repo.move(a, "down")).toBe(false);
  });

  it("removes and returns the removed item", async () => {
    const id = await repo.create({ title: "A" });
    expect((await repo.remove(id))?.title).toBe("A");
    expect(await repo.count()).toBe(0);
  });

  it("patch sets only the given fields", async () => {
    const id = await repo.create({ title: "A", note: "keep" });
    await repo.patch(id, { title: "B" });
    expect(await repo.get(id)).toMatchObject({ title: "B", note: "keep" });
  });

  it("enforces unique project slugs", async () => {
    const project = {
      slug: "one", title: "One", description: "d", year: "2026", category: ["c"], technologies: ["t"],
      featured: false, features: [], metrics: [],
    };
    await repos.projects.create(project);
    await expect(repos.projects.create(project)).rejects.toMatchObject({ code: 11000 });
  });
});
