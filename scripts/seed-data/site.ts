import type { SiteConfig } from "@/types/site";

// TODO(content): replace the placeholder name, email, social links and domain before launch.
export const siteConfig: SiteConfig = {
  brand: "AnbuDev",
  name: "Your Name",
  title: "Full-Stack Developer",
  description: "I build digital products across web, product UI, and AI.",
  role: "Full-stack developer",
  focus: "Web / Product / AI",
  location: "India / Remote",
  availability: "available",
  email: "hello@example.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vecna.dev",
  year: "2026",
  portrait: undefined,
  resumeUrl: undefined,
  social: {
    github: "https://github.com/",
    fiverr: "https://www.fiverr.com/",
    upwork: "https://www.upwork.com/",
  },
  builtWith: "Next.js / TypeScript / Coffee",
  openTo: "Selected freelance projects",
};

/** Used by the Open Graph image. */
export const hero = {
  lines: ["I build", "digital", "products."],
  accentLine: 1,
  roles: "Full-stack developer / UI / AI",
};

export const about = {
  intro: [
    "I engineer elegant, high-velocity digital products where meticulous craft meets intelligent technology.",
    "I care about clean interfaces, scalable systems, and shipping things that people actually use.",
  ],
};
