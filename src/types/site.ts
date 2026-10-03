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
  /** ImageKit URL. Without one, an initials monogram is shown. */
  portrait?: string;
  portraitAlt?: string;
  /** ImageKit URL for the top bar button. Without one, the initials are shown. */
  avatar?: string;
  resumeUrl?: string;
  social: {
    github?: string;
    fiverr?: string;
    upwork?: string;
  };
  builtWith: string;
  openTo: string;
};

/** The slice of the site config the client-side navigation needs. */
export type NavSite = Pick<SiteConfig, "brand" | "name" | "email" | "resumeUrl" | "availability" | "avatar">;
