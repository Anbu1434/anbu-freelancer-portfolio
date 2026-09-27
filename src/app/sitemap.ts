import type { MetadataRoute } from "next";
import { caseStudyProjects } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/work", "/about", "/services"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const caseStudies = caseStudyProjects.map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...caseStudies];
}
