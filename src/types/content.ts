export type Service = {
  number: string;
  title: string;
  description: string;
  includes: string[];
};

export type Testimonial = {
  quote: string;
  name: string;
  role?: string;
  company?: string;
  /** Path under /public, e.g. "/clients/jane.jpg". Without one, an initials monogram is shown. */
  avatar?: string;
  /** Out of 5. Only set it if the client actually gave a score. */
  rating?: number;
};

export type Experience = {
  role: string;
  company: string;
  period: string;
};

export type ProcessStep = {
  number: string;
  title: string;
  description: string;
};

export type StackGroup = {
  label: string;
  items: string[];
};
