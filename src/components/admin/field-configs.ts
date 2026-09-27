export type ImageFolder = "projects" | "portrait" | "testimonials";

type Base = { name: string; label: string; hint?: string };

export type FieldConfig = Base &
  (
    | { type: "text" | "email" | "url" }
    | { type: "textarea"; rows?: number }
    | { type: "number"; min?: number; max?: number; step?: number }
    | { type: "list"; itemLabel: string; multiline?: boolean }
    | { type: "toggle" }
    | { type: "select"; options: readonly { value: string; label: string }[] }
    | { type: "image"; folder: ImageFolder }
    | { type: "pairs"; keys: readonly [string, string]; keyLabels: readonly [string, string] }
  );

export type FormSection = { title?: string; fields: FieldConfig[] };

/** Blank values for a "new item" form. */
export function emptyValues(sections: FormSection[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    if (field.type === "list" || field.type === "pairs") values[field.name] = [];
    else if (field.type === "toggle") values[field.name] = false;
    else if (field.type === "select") values[field.name] = field.options[0]?.value ?? "";
    else if (field.type === "number" || field.type === "image") values[field.name] = undefined;
    else values[field.name] = "";
  }
  return values;
}

export const serviceSections: FormSection[] = [
  {
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Short description", type: "textarea", rows: 2 },
      { name: "includes", label: "What's included", type: "list", itemLabel: "Item" },
    ],
  },
];

export const processSections: FormSection[] = [
  {
    fields: [
      { name: "title", label: "Step title", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
    ],
  },
];

export const experienceSections: FormSection[] = [
  {
    fields: [
      { name: "role", label: "Role", type: "text" },
      { name: "company", label: "Company or client", type: "text" },
      { name: "period", label: "Period", type: "text", hint: "e.g. 2024 – Present" },
    ],
  },
];

export const stackSections: FormSection[] = [
  {
    fields: [
      { name: "label", label: "Group label", type: "text", hint: "e.g. Frontend" },
      { name: "items", label: "Technologies", type: "list", itemLabel: "Technology" },
    ],
  },
];

export const testimonialSections: FormSection[] = [
  {
    fields: [
      { name: "quote", label: "Quote", type: "textarea", rows: 4, hint: "Only publish real feedback you have permission to use." },
      { name: "name", label: "Client name", type: "text" },
      { name: "role", label: "Their role", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "rating", label: "Rating (1–5, optional)", type: "number", min: 1, max: 5, step: 0.1 },
      { name: "avatar", label: "Photo (optional)", type: "image", folder: "testimonials" },
      { name: "published", label: "Show on the site", type: "toggle" },
    ],
  },
];

export const projectSections: FormSection[] = [
  {
    title: "Basics",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "URL slug", type: "text", hint: "Used in /work/<slug>. Lowercase, numbers and dashes." },
      { name: "description", label: "One-line description", type: "textarea", rows: 2 },
      { name: "year", label: "Year", type: "text" },
      { name: "category", label: "Categories", type: "list", itemLabel: "Category", hint: "“Web application” + a live URL links the card straight to the live site." },
      { name: "technologies", label: "Technologies", type: "list", itemLabel: "Technology" },
      { name: "featured", label: "Feature on the home page", type: "toggle" },
      { name: "image", label: "Cover image", type: "image", folder: "projects" },
    ],
  },
  {
    title: "Links & credits",
    fields: [
      { name: "liveUrl", label: "Live URL", type: "url" },
      { name: "githubUrl", label: "Source code URL", type: "url" },
      { name: "client", label: "Client", type: "text" },
      { name: "role", label: "Your role", type: "text" },
    ],
  },
  {
    title: "Case study",
    fields: [
      { name: "overview", label: "Overview", type: "textarea", rows: 4 },
      { name: "problem", label: "Problem", type: "textarea", rows: 4 },
      { name: "approach", label: "Approach", type: "textarea", rows: 4 },
      { name: "features", label: "Key features", type: "list", itemLabel: "Feature" },
      { name: "engineering", label: "Design / engineering", type: "textarea", rows: 4 },
      { name: "result", label: "Result", type: "textarea", rows: 4, hint: "Only real outcomes." },
      { name: "metrics", label: "Metrics", type: "pairs", keys: ["label", "value"], keyLabels: ["Label", "Value"] },
    ],
  },
];

export const settingsSections: FormSection[] = [
  {
    title: "Profile",
    fields: [
      { name: "brand", label: "Brand (browser tab + logo)", type: "text" },
      { name: "name", label: "Your name", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "role", label: "Role (home page heading)", type: "text" },
      { name: "description", label: "Site description (SEO)", type: "textarea", rows: 2 },
      { name: "focus", label: "Focus", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "email", label: "Public email", type: "email" },
      { name: "portrait", label: "Portrait", type: "image", folder: "portrait" },
      { name: "resumeUrl", label: "Resume URL", type: "url" },
      {
        name: "availability",
        label: "Availability",
        type: "select",
        options: [
          { value: "available", label: "Available for freelance" },
          { value: "limited", label: "Limited availability" },
          { value: "unavailable", label: "Currently booked" },
        ],
      },
      { name: "openTo", label: "Open to", type: "text" },
      { name: "year", label: "Year (footer)", type: "text" },
      { name: "builtWith", label: "Built with (footer)", type: "text" },
    ],
  },
  {
    title: "Social links",
    fields: [
      { name: "social.github", label: "GitHub", type: "url" },
      { name: "social.fiverr", label: "Fiverr", type: "url" },
      { name: "social.upwork", label: "Upwork", type: "url" },
    ],
  },
  {
    title: "Hero & about",
    fields: [
      { name: "hero.lines", label: "Share-image headline lines", type: "list", itemLabel: "Line" },
      { name: "hero.accentLine", label: "Highlighted line (0 = first)", type: "number", min: 0, step: 1 },
      { name: "hero.roles", label: "Share-image roles line", type: "text" },
      { name: "about.intro", label: "About paragraphs", type: "list", itemLabel: "Paragraph", multiline: true, hint: "The first paragraph appears on the home and about cards." },
    ],
  },
  {
    title: "Project requests",
    fields: [
      { name: "inquiryServices", label: "Services clients can pick", type: "list", itemLabel: "Service" },
      { name: "autoReplyMessage", label: "Auto-reply message to clients", type: "textarea", rows: 4 },
    ],
  },
];

export const replySections: FormSection[] = [
  {
    fields: [
      { name: "subject", label: "Subject", type: "text" },
      { name: "body", label: "Message", type: "textarea", rows: 8 },
    ],
  },
];
