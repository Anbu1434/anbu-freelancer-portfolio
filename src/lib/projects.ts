import { getProjects } from "@/lib/content";
import type { Project } from "@/types/project";

/** Web applications skip the case study and link straight to the live site. */
export function linksToLiveSite(project: Project): project is Project & { liveUrl: string } {
  return project.category.includes("Web application") && Boolean(project.liveUrl);
}

export function getProjectHref(project: Project) {
  return linksToLiveSite(project) ? project.liveUrl : `/work/${project.slug}`;
}

/** Projects that get their own /work/[slug] page. */
export async function getCaseStudyProjects() {
  return (await getProjects()).filter((project) => !linksToLiveSite(project));
}

export async function getProject(slug: string) {
  return (await getCaseStudyProjects()).find((project) => project.slug === slug);
}

export async function getFeaturedProjects() {
  return (await getProjects()).filter((project) => project.featured);
}

export async function getNextProject(slug: string) {
  const caseStudies = await getCaseStudyProjects();
  if (caseStudies.length < 2) return undefined;
  const index = caseStudies.findIndex((project) => project.slug === slug);
  return caseStudies[(index + 1) % caseStudies.length];
}
