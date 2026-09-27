export type Availability = "available" | "limited" | "unavailable";

export type SiteConfig = {
  brand: string;
  name: string;
  title: string;
  description: string;
  role: string;
  focus: string;
  location: string;
  availability: Availability;
  email: string;
  url: string;
  year: string;
  /** Path under /public. Without one, an initials monogram is shown. */
  portrait?: string;
  resumeUrl?: string;
  social: {
    github?: string;
    fiverr?: string;
    upwork?: string;
  };
  builtWith: string;
  openTo: string;
};
