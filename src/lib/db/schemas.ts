import { z } from "zod";

const text = (max: number) => z.string().trim().min(1, "Required.").max(max, `Keep this under ${max} characters.`);
// `.optional()` goes outermost so the inferred type keeps the key optional; "" becomes undefined.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((value) => value || undefined)
    .optional();
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https?:\/\/\S+$/, "Must be a full URL starting with http:// or https://.");
const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .transform((value) => value || undefined)
  .optional();
const stringList = (max: number) => z.array(z.string().trim().min(1, "Remove empty items.").max(max)).max(50);

export const imageRefSchema = z.object({
  url: httpUrl.refine(
    (url) => url.startsWith(process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/"),
    "Images must be uploaded to ImageKit.",
  ),
  fileId: z.string().trim().min(1).max(100),
  alt: z.string().trim().max(200),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

export const availabilityValues = ["available", "limited", "unavailable"] as const;

export const settingsSchema = z.object({
  brand: text(60),
  name: text(100),
  title: text(100),
  description: text(300),
  role: text(100),
  focus: text(100),
  location: text(100),
  availability: z.enum(availabilityValues),
  email: z.email("Enter a valid email.").max(200),
  year: text(10),
  portrait: imageRefSchema.optional(),
  resumeUrl: optionalUrl,
  social: z.object({ github: optionalUrl, fiverr: optionalUrl, upwork: optionalUrl }),
  builtWith: text(200),
  openTo: text(200),
  hero: z
    .object({
      lines: stringList(40).min(1, "Add at least one line."),
      accentLine: z.number().int().min(0),
      roles: text(200),
    })
    .refine((hero) => hero.accentLine < hero.lines.length, {
      message: "Pick a line that exists (0 = first line).",
      path: ["accentLine"],
    }),
  about: z.object({ intro: stringList(1000).min(1, "Add at least one paragraph.") }),
  inquiryServices: stringList(60).min(1, "Add at least one service."),
  autoReplyMessage: text(2000),
});
export type Settings = z.infer<typeof settingsSchema>;

export const serviceSchema = z.object({
  title: text(80),
  description: text(300),
  includes: stringList(120),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const processStepSchema = z.object({ title: text(80), description: text(500) });
export type ProcessStepInput = z.infer<typeof processStepSchema>;

export const experienceSchema = z.object({ role: text(100), company: text(100), period: text(60) });
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const stackGroupSchema = z.object({ label: text(40), items: stringList(40).min(1, "Add at least one item.") });
export type StackGroupInput = z.infer<typeof stackGroupSchema>;

export const testimonialSchema = z.object({
  quote: text(1000),
  name: text(100),
  role: optionalText(100),
  company: optionalText(100),
  avatar: imageRefSchema.optional(),
  rating: z
    .number()
    .min(1, "Between 1 and 5.")
    .max(5, "Between 1 and 5.")
    .transform((value) => Math.round(value * 10) / 10)
    .optional(),
  published: z.boolean(),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const projectCategories = ["Web application", "Software", "SEO & Performance"] as const;
/** Only these categories get a /work/[slug] case study; everything else links to the live site. */
export const caseStudyCategories: readonly string[] = ["Software", "SEO & Performance"] satisfies (typeof projectCategories)[number][];

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Required.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single dashes only."),
  title: text(120),
  description: text(300),
  year: text(10),
  category: z
    .array(z.enum(projectCategories, "Pick a category from the list."))
    .min(1, "Pick at least one category.")
    .refine((values) => new Set(values).size === values.length, "Each category only once."),
  technologies: stringList(40).min(1, "Add at least one technology."),
  images: z.array(imageRefSchema).max(3, "Add up to 3 images.").optional(),
  featured: z.boolean(),
  client: optionalText(120),
  role: optionalText(120),
  overview: optionalText(3000),
  problem: optionalText(3000),
  approach: optionalText(3000),
  features: stringList(200),
  engineering: optionalText(3000),
  result: optionalText(3000),
  metrics: z.array(z.object({ label: text(60), value: text(30) })).max(12),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const inquiryStatuses = ["new", "read", "replied", "archived"] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const loginSchema = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Required."),
    next: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export const replySchema = z.object({ subject: text(200), body: text(10_000) });
