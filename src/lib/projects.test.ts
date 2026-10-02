import { describe, expect, it, vi } from "vitest";
import { repos } from "@/lib/db/repos";
import { setupTestDb } from "@/test/mongo";

// Outside Next there is no incremental cache; call the loaders directly.
vi.mock("next/cache", () => ({ unstable_cache: <T>(load: T) => load }));

const { getCaseStudyProjects, getFeaturedProjects, getNextProject, getProject } = await import("@/lib/projects");

setupTestDb();

const base = { description: "d", year: "2026", technologies: ["React"], featured: true, features: [], metrics: [] };

describe("project helpers", () => {
  it("returns undefined for an unknown or deleted slug", async () => {
    const id = await repos.projects.create({ ...base, slug: "gone", title: "Gone", category: ["Software"] });
    await repos.projects.remove(id);
    expect(await getProject("gone")).toBeUndefined();
  });

  it("gives case studies only to software and SEO & performance projects", async () => {
    await repos.projects.create({ ...base, slug: "app", title: "App", category: ["Web application"], liveUrl: "https://app.example" });
    await repos.projects.create({ ...base, slug: "tool", title: "Tool", category: ["Software"] });
    await repos.projects.create({ ...base, slug: "speed", title: "Speed", category: ["Web application", "SEO & Performance"] });
    expect((await getCaseStudyProjects()).map((project) => project.slug)).toEqual(["tool", "speed"]);
    expect(await getProject("app")).toBeUndefined();
  });

  it("numbers projects by position and wraps the next project", async () => {
    await repos.projects.create({ ...base, slug: "a", title: "A", category: ["Software"] });
    await repos.projects.create({ ...base, slug: "b", title: "B", category: ["Software"] });
    expect((await getProject("b"))?.number).toBe("02");
    expect((await getNextProject("b"))?.slug).toBe("a");
  });

  it("returns at most three featured projects, in order", async () => {
    for (const slug of ["f1", "f2", "hidden", "f3", "f4"]) {
      await repos.projects.create({ ...base, slug, title: slug, category: ["Software"], featured: slug !== "hidden" });
    }
    expect((await getFeaturedProjects()).map((project) => project.slug)).toEqual(["f1", "f2", "f3"]);
  });
});
