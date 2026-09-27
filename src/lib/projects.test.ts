import { describe, expect, it, vi } from "vitest";
import { repos } from "@/lib/db/repos";
import { setupTestDb } from "@/test/mongo";

// Outside Next there is no incremental cache; call the loaders directly.
vi.mock("next/cache", () => ({ unstable_cache: <T>(load: T) => load }));

const { getCaseStudyProjects, getNextProject, getProject } = await import("@/lib/projects");

setupTestDb();

const base = { description: "d", year: "2026", technologies: ["React"], featured: true, features: [], metrics: [] };

describe("project helpers", () => {
  it("returns undefined for an unknown or deleted slug", async () => {
    const id = await repos.projects.create({ ...base, slug: "gone", title: "Gone", category: ["Case study"] });
    await repos.projects.remove(id);
    expect(await getProject("gone")).toBeUndefined();
  });

  it("excludes web applications with a live URL from case studies", async () => {
    await repos.projects.create({ ...base, slug: "app", title: "App", category: ["Web application"], liveUrl: "https://app.example" });
    await repos.projects.create({ ...base, slug: "study", title: "Study", category: ["Branding"] });
    expect((await getCaseStudyProjects()).map((project) => project.slug)).toEqual(["study"]);
    expect(await getProject("app")).toBeUndefined();
  });

  it("numbers projects by position and wraps the next project", async () => {
    await repos.projects.create({ ...base, slug: "a", title: "A", category: ["X"] });
    await repos.projects.create({ ...base, slug: "b", title: "B", category: ["X"] });
    expect((await getProject("b"))?.number).toBe("02");
    expect((await getNextProject("b"))?.slug).toBe("a");
  });
});
