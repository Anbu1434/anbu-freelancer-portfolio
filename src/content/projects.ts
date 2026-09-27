import type { Project } from "@/types/project";

// TODO(content): replace bracketed placeholders with real project information.
// Never invent clients, metrics or outcomes — leave a field out instead.
export const projects: Project[] = [
  {
    slug: "lms-platform",
    number: "01",
    title: "LMS Platform",
    description: "Learning platform for structured online education.",
    year: "2026",
    category: ["Web application"],
    technologies: ["React", "Django", "PostgreSQL"],
    featured: true,
    role: "Full-stack development",
    overview: "[Overview — two or three sentences on what the platform is and who it serves.]",
    problem: "[Problem — what wasn't working before, and for whom?]",
    approach: "[Approach — the key decisions you made and why.]",
    features: ["[Key feature one]", "[Key feature two]", "[Key feature three]", "[Key feature four]"],
    engineering: "[Design / engineering — architecture, interface decisions and trade-offs.]",
    result: "[Result — what shipped and what changed. Only real outcomes.]",
  },
  {
    slug: "project-two",
    number: "02",
    title: "Project Two",
    description: "[Placeholder — add a real project in src/content/projects.ts.]",
    year: "2025",
    category: ["[Category]"],
    technologies: ["[Tech]", "[Stack]"],
    featured: true,
  },
  {
    slug: "project-three",
    number: "03",
    title: "Project Three",
    description: "[Placeholder — add a real project in src/content/projects.ts.]",
    year: "2025",
    category: ["[Category]"],
    technologies: ["[Tech]", "[Stack]"],
    featured: true,
  },
];
