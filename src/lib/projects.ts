import { getProjects } from "@/lib/content";
import { caseStudyCategories } from "@/lib/db/schemas";
import type { Project } from "@/types/project";

/** Software and SEO & performance projects get a case study; the rest (web applications) don't. */
export function hasCaseStudy(project: Project) {
  return project.category.some((category) => caseStudyCategories.includes(category));
}

/** Projects without a case study link straight to the live site, when there is one. */
export function linksToLiveSite(project: Project): project is Project & { liveUrl: string } {
  return !hasCaseStudy(project) && Boolean(project.liveUrl);
}

/** Undefined when the project has neither a case study nor a live site. */
export function getProjectHref(project: Project) {
  if (hasCaseStudy(project)) return `/work/${project.slug}`;
  return project.liveUrl;
}

/** Projects that get their own /work/[slug] page. */
export async function getCaseStudyProjects() {
  return (await getProjects()).filter(hasCaseStudy);
}

export async function getProject(slug: string) {
  return (await getCaseStudyProjects()).find((project) => project.slug === slug);
}

/** The home page shows at most this many, in admin order. */
export const FEATURED_LIMIT = 3;

export async function getFeaturedProjects() {
  return (await getProjects()).filter((project) => project.featured).slice(0, FEATURED_LIMIT);
}

export async function getNextProject(slug: string) {
  const caseStudies = await getCaseStudyProjects();
  if (caseStudies.length < 2) return undefined;
  const index = caseStudies.findIndex((project) => project.slug === slug);
  return caseStudies[(index + 1) % caseStudies.length];
}
