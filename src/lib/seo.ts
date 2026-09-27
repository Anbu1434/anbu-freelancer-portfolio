import type { Metadata } from "next";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import type { Project } from "@/types/project";

export const defaultTitle = `${siteConfig.brand} — ${siteConfig.title}`;

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

type MetadataInput = {
  /** Omit on the home page to use the default title. */
  title?: string;
  description?: string;
  path: string;
};

// A page-level `openGraph` object replaces the inherited one, dropping the file-based image,
// so the root OG image is referenced explicitly.
const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: defaultTitle };

export function createMetadata({ title, description = siteConfig.description, path }: MetadataInput): Metadata {
  const fullTitle = title ? `${title} — ${siteConfig.brand}` : defaultTitle;

  return {
    title: { absolute: siteConfig.brand },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.brand,
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

const sameAs = Object.values(siteConfig.social).filter(Boolean);

function person() {
  return {
    "@type": "Person",
    "@id": absoluteUrl("/#person"),
    name: siteConfig.name,
    jobTitle: siteConfig.title,
    url: siteConfig.url,
    email: `mailto:${siteConfig.email}`,
    sameAs,
  };
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(),
      {
        "@type": "ProfessionalService",
        "@id": absoluteUrl("/#service"),
        name: siteConfig.brand,
        url: siteConfig.url,
        description: siteConfig.description,
        email: siteConfig.email,
        founder: { "@id": absoluteUrl("/#person") },
        serviceType: services.map((service) => service.title),
      },
    ],
  };
}

export function projectJsonLd(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: absoluteUrl(`/work/${project.slug}`),
    dateCreated: project.year,
    keywords: project.technologies.join(", "),
    creator: person(),
    ...(project.image && { image: absoluteUrl(project.image) }),
  };
}
