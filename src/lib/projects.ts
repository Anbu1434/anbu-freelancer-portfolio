import { projects } from "@/content/projects";
import type { Project } from "@/types/project";

export { projects };

/** Web applications skip the case study and link straight to the live site. */
export function linksToLiveSite(project: Project): project is Project & { liveUrl: string } {
  return project.category.includes("Web application") && Boolean(project.liveUrl);
}

export function getProjectHref(project: Project) {
  return linksToLiveSite(project) ? project.liveUrl : `/work/${project.slug}`;
}

/** Projects that get their own /work/[slug] page. */
export const caseStudyProjects = projects.filter((project) => !linksToLiveSite(project));

export function getProject(slug: string) {
  return caseStudyProjects.find((project) => project.slug === slug);
}

export function getFeaturedProjects() {
  return projects.filter((project) => project.featured);
}

export function getNextProject(slug: string) {
  if (caseStudyProjects.length < 2) return undefined;
  const index = caseStudyProjects.findIndex((project) => project.slug === slug);
  return caseStudyProjects[(index + 1) % caseStudyProjects.length];
}
