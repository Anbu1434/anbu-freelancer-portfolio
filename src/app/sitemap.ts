import type { MetadataRoute } from "next";
import { getCaseStudyProjects } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/work", "/about", "/services"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const caseStudies = (await getCaseStudyProjects()).map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...caseStudies];
}
