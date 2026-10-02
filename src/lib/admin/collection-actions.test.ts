import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectionActions } from "@/lib/admin/collection-actions";
import { refresh } from "@/lib/admin/refresh";
import { repos } from "@/lib/db/repos";
import { projectSchema } from "@/lib/db/schemas";
import { deleteReplacedImages } from "@/lib/imagekit";
import { setupTestDb } from "@/test/mongo";

vi.mock("@/lib/auth/dal", () => ({ requireAdmin: vi.fn(async () => ({ id: "a1", email: "me@example.com" })) }));
vi.mock("@/lib/admin/refresh", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/imagekit", () => ({ deleteReplacedImages: vi.fn(async () => {}) }));

setupTestDb();

beforeEach(() => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
  vi.clearAllMocks();
});

const actions = collectionActions({ repo: repos.projects, schema: projectSchema, tags: ["projects"], imageFields: ["images"] });
const project = { slug: "one", title: "One", description: "d", year: "2026", category: ["Software"], technologies: ["t"], featured: false, features: [], metrics: [] };
const image = (fileId: string) => ({ url: `https://ik.imagekit.io/demo/${fileId}.png`, fileId, alt: "" });

describe("collectionActions", () => {
  it("returns field errors and writes nothing for invalid input", async () => {
    expect(await actions.create({ ...project, slug: "Bad Slug" })).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } });
    expect(await repos.projects.count()).toBe(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("creates and expires the public tag", async () => {
    expect(await actions.create(project)).toMatchObject({ ok: true, id: expect.any(String) });
    expect(refresh).toHaveBeenCalledWith("projects");
  });

  it("reports a duplicate slug on the slug field", async () => {
    await actions.create(project);
    expect(await actions.create(project)).toMatchObject({ ok: false, fieldErrors: { slug: "Already in use." } });
  });

  it("deletes replaced gallery images on update, and all of them on delete", async () => {
    const created = await actions.create({ ...project, images: [image("keep"), image("old")] });
    if (!created.ok || !created.id) throw new Error("create failed");
    await actions.update(created.id, { ...project, images: [image("keep"), image("new")] });
    expect(deleteReplacedImages).toHaveBeenCalledWith([image("keep"), image("old")], [image("keep"), image("new")]);
    await actions.remove(created.id);
    expect(deleteReplacedImages).toHaveBeenLastCalledWith([image("keep"), image("new")], []);
  });

  it("rejects more than three project images", async () => {
    const result = await actions.create({ ...project, images: ["a", "b", "c", "d"].map(image) });
    expect(result).toMatchObject({ ok: false, fieldErrors: { images: "Add up to 3 images." } });
  });

  it("fails cleanly when the item no longer exists", async () => {
    expect(await actions.update("000000000000000000000000", project)).toMatchObject({ ok: false });
  });
});
