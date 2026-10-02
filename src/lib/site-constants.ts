import type { SiteConfig } from "@/types/site";

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
] as const;

export const availabilityLabels = {
  available: { short: "Available", long: "Available for freelance" },
  limited: { short: "Limited", long: "Limited availability" },
  unavailable: { short: "Booked", long: "Currently booked" },
} as const;

export const socialLabels: Record<keyof SiteConfig["social"], string> = {
  github: "GitHub",
  fiverr: "Fiverr",
  upwork: "Upwork",
};
