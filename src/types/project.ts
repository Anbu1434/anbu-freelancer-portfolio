export type Project = {
  slug: string;
  number: string;
  title: string;
  description: string;
  year: string;
  category: string[];
  technologies: string[];
  /** Path under /public. Without one, a typography-led placeholder is rendered. */
  image?: string;
  imageAlt?: string;
  featured: boolean;
  client?: string;
  role?: string;
  overview?: string;
  problem?: string;
  approach?: string;
  features?: string[];
  engineering?: string;
  result?: string;
  metrics?: { label: string; value: string }[];
  liveUrl?: string;
  githubUrl?: string;
};
