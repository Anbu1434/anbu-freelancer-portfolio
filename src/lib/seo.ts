import type { Metadata } from "next";
import type { Service } from "@/types/content";
import type { Project } from "@/types/project";
import type { SiteConfig } from "@/types/site";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vecna.dev";

export function defaultTitle(site: SiteConfig) {
  return `${site.brand} — ${site.title}`;
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

type MetadataInput = {
  /** Omit on the home page to use the default title. */
  title?: string;
  description?: string;
  path: string;
};

export function createMetadata(site: SiteConfig, { title, description = site.description, path }: MetadataInput): Metadata {
  const fullTitle = title ? `${title} — ${site.brand}` : defaultTitle(site);
  // A page-level `openGraph` object replaces the inherited one, dropping the file-based image,
  // so the root OG image is referenced explicitly.
  const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: defaultTitle(site) };

  return {
    title: { absolute: site.brand },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.brand,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}

function person(site: SiteConfig) {
  return {
    "@type": "Person",
    "@id": absoluteUrl("/#person"),
    name: site.name,
    jobTitle: site.title,
    url: site.url,
    email: `mailto:${site.email}`,
    sameAs: Object.values(site.social).filter(Boolean),
  };
}

export function homeJsonLd(site: SiteConfig, services: Service[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(site),
      {
        "@type": "ProfessionalService",
        "@id": absoluteUrl("/#service"),
        name: site.brand,
        url: site.url,
        description: site.description,
        email: site.email,
        founder: { "@id": absoluteUrl("/#person") },
        serviceType: services.map((service) => service.title),
      },
    ],
  };
}

export function projectJsonLd(site: SiteConfig, project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: absoluteUrl(`/work/${project.slug}`),
    dateCreated: project.year,
    keywords: project.technologies.join(", "),
    creator: person(site),
    // Images are absolute ImageKit URLs now.
    ...(project.image && { image: project.image }),
  };
}
