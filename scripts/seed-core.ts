import type { z } from "zod";
import { repos } from "@/lib/db/repos";
import {
  experienceSchema,
  processStepSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  stackGroupSchema,
  testimonialSchema,
} from "@/lib/db/schemas";
import { findSettings, saveSettings } from "@/lib/db/settings";
import type { OrderedRepo } from "@/lib/db/ordered-repo";
import { omit } from "@/lib/object";
import { experience } from "./seed-data/experience";
import { projects } from "./seed-data/projects";
import { services, workProcess } from "./seed-data/services";
import { about, hero, siteConfig } from "./seed-data/site";
import { stack } from "./seed-data/stack";
import { testimonials } from "./seed-data/testimonials";

// The service options previously hard-coded in src/lib/inquiry.ts.
const inquiryServices = ["Website Development", "E-commerce", "Custom Software", "AI / Automation", "Mobile App", "UI/UX Design", "SEO"];

async function seedCollection<S extends z.ZodType<object>>(repo: OrderedRepo<z.infer<S>>, schema: S, items: unknown[]) {
  if ((await repo.count()) > 0) return "skipped" as const;
  for (const item of items) await repo.create(schema.parse(item));
  return "seeded" as const;
}

/** Copies the original src/content data into MongoDB. Collections that already hold data are left alone. */
export async function seedDatabase() {
  const report: Record<string, "seeded" | "skipped"> = {};

  if (await findSettings()) {
    report.settings = "skipped";
  } else {
    await saveSettings(
      settingsSchema.parse({
        ...omit(siteConfig, "url", "portrait"),
        resumeUrl: siteConfig.resumeUrl ?? "",
        hero,
        about,
        inquiryServices,
        autoReplyMessage:
          "Thanks for reaching out! I've received your project request and will get back to you within 1–2 business days.",
      }),
    );
    report.settings = "seeded";
  }

  report.projects = await seedCollection(
    repos.projects,
    projectSchema,
    projects.map((project) => ({
      ...omit(project, "number", "image", "imageAlt"),
      features: project.features ?? [],
      metrics: project.metrics ?? [],
    })),
  );
  report.services = await seedCollection(repos.services, serviceSchema, services.map((service) => omit(service, "number")));
  report.processSteps = await seedCollection(repos.processSteps, processStepSchema, workProcess.map((step) => omit(step, "number")));
  report.experience = await seedCollection(repos.experience, experienceSchema, experience);
  report.stackGroups = await seedCollection(repos.stackGroups, stackGroupSchema, stack);
  report.testimonials = await seedCollection(
    repos.testimonials,
    testimonialSchema,
    testimonials.map((testimonial) => ({ ...omit(testimonial, "avatar"), published: true })),
  );

  return report;
}
