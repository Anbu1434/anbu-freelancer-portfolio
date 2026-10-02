import { unstable_cache } from "next/cache";
import { pad } from "@/lib/cn";
import type { Stored } from "@/lib/db/ordered-repo";
import { repos } from "@/lib/db/repos";
import type { ImageRef, ProjectInput, Settings } from "@/lib/db/schemas";
import { findSettings } from "@/lib/db/settings";
import { omit } from "@/lib/object";
import type { Experience, ProcessStep, Service, StackGroup, Testimonial } from "@/types/content";
import type { Project } from "@/types/project";
import type { SiteConfig } from "@/types/site";

/** Public reads are cached under these tags; admin saves expire the matching tag (see lib/admin/refresh.ts). */
export const contentTags = ["settings", "projects", "services", "process", "experience", "stack", "testimonials"] as const;
export type ContentTag = (typeof contentTags)[number];

function cached<T>(tag: ContentTag, load: () => Promise<T>) {
  return unstable_cache(load, [`content:${tag}`], { tags: [tag] });
}

const meta = ["id", "sortOrder", "createdAt", "updatedAt"] as const;

export const getSettings = cached("settings", async () => {
  const settings = await findSettings();
  if (!settings) throw new Error("Site settings are missing. Run `npm run db:seed`.");
  return settings;
});

export function toSiteConfig(settings: Settings): SiteConfig {
  return {
    brand: settings.brand,
    name: settings.name,
    title: settings.title,
    description: settings.description,
    role: settings.role,
    focus: settings.focus,
    location: settings.location,
    availability: settings.availability,
    email: settings.email,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vecna.dev",
    year: settings.year,
    portrait: settings.portrait?.url,
    portraitAlt: settings.portrait?.alt || undefined,
    resumeUrl: settings.resumeUrl,
    social: settings.social,
    builtWith: settings.builtWith,
    openTo: settings.openTo,
  };
}

export async function getSiteConfig() {
  return toSiteConfig(await getSettings());
}

/** Projects saved before galleries existed hold a single `image`; read it as a one-image list. */
export function storedProjectImages(stored: Stored<ProjectInput>): ImageRef[] {
  const legacy = (stored as { image?: ImageRef }).image;
  return stored.images ?? (legacy ? [legacy] : []);
}

export function toProject(stored: Stored<ProjectInput>, index: number): Project {
  return {
    ...omit(stored as Stored<ProjectInput> & { image?: ImageRef }, ...meta, "image", "images"),
    number: pad(index + 1),
    images: storedProjectImages(stored).map((image) => ({ src: image.url, alt: image.alt || undefined })),
  };
}

export const getProjects = cached("projects", async () => (await repos.projects.list()).map(toProject));

export const getServices = cached("services", async (): Promise<Service[]> =>
  (await repos.services.list()).map((service, index) => ({ ...omit(service, ...meta), number: pad(index + 1) })),
);

export const getProcessSteps = cached("process", async (): Promise<ProcessStep[]> =>
  (await repos.processSteps.list()).map((step, index) => ({ ...omit(step, ...meta), number: pad(index + 1) })),
);

export const getExperience = cached("experience", async (): Promise<Experience[]> =>
  (await repos.experience.list()).map((item) => omit(item, ...meta)),
);

export const getStack = cached("stack", async (): Promise<StackGroup[]> =>
  (await repos.stackGroups.list()).map((group) => omit(group, ...meta)),
);

export const getTestimonials = cached("testimonials", async (): Promise<Testimonial[]> =>
  (await repos.testimonials.list({ published: true })).map((item) => ({
    ...omit(item, ...meta, "avatar", "published"),
    avatar: item.avatar?.url,
  })),
);
