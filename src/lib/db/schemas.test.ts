import { beforeAll, describe, expect, it } from "vitest";
import { projectSchema, settingsSchema, testimonialSchema } from "@/lib/db/schemas";

beforeAll(() => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
});

const validSettings = {
  brand: "AnbuDev",
  name: "Anbu",
  title: "Full-Stack Developer",
  description: "I build digital products.",
  role: "Full-stack developer",
  focus: "Web / Product / AI",
  location: "India / Remote",
  availability: "available",
  email: "hello@example.com",
  year: "2026",
  resumeUrl: "",
  social: { github: "https://github.com/me", fiverr: "", upwork: "" },
  builtWith: "Next.js",
  openTo: "Freelance",
  hero: { lines: ["I build", "digital", "products."], accentLine: 1, roles: "Full-stack" },
  about: { intro: ["First paragraph."] },
  inquiryServices: ["Website Development"],
  autoReplyMessage: "Thanks — I'll reply within 1–2 business days.",
};

describe("settingsSchema", () => {
  it("accepts valid settings and turns empty optional URLs into undefined", () => {
    const parsed = settingsSchema.parse(validSettings);
    expect(parsed.resumeUrl).toBeUndefined();
    expect(parsed.social.fiverr).toBeUndefined();
    expect(parsed.social.github).toBe("https://github.com/me");
  });

  it("rejects an accent line outside the hero lines", () => {
    const result = settingsSchema.safeParse({ ...validSettings, hero: { ...validSettings.hero, accentLine: 3 } });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["hero", "accentLine"]);
  });

  it("rejects javascript: URLs", () => {
    const result = settingsSchema.safeParse({ ...validSettings, resumeUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("rejects a portrait not hosted on the ImageKit endpoint", () => {
    const result = settingsSchema.safeParse({
      ...validSettings,
      portrait: { url: "https://evil.example/x.png", fileId: "f1", alt: "" },
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const base = {
    slug: "lms-platform",
    title: "LMS",
    description: "Learning platform.",
    year: "2026",
    category: ["Web application"],
    technologies: ["React"],
    featured: true,
    features: [],
    metrics: [],
    client: "",
  };

  it("accepts a minimal project and drops empty optional text", () => {
    const parsed = projectSchema.parse(base);
    expect(parsed.client).toBeUndefined();
  });

  it("rejects slugs with spaces or capitals", () => {
    expect(projectSchema.safeParse({ ...base, slug: "My Project" }).success).toBe(false);
  });
});

describe("testimonialSchema", () => {
  it("rounds rating to one decimal and bounds it to 1–5", () => {
    expect(testimonialSchema.parse({ quote: "Great", name: "A", published: true, rating: 4.86 }).rating).toBe(4.9);
    expect(testimonialSchema.safeParse({ quote: "Great", name: "A", published: true, rating: 6 }).success).toBe(false);
  });
});
