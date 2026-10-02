export type Project = {
  slug: string;
  number: string;
  title: string;
  description: string;
  year: string;
  category: string[];
  technologies: string[];
  /** Up to 3 ImageKit images; more than one rotates as a carousel. Without any, a typography-led placeholder is rendered. */
  images?: { src: string; alt?: string }[];
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
