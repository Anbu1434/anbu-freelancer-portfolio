import { FolderCode } from "lucide-react";
import type { Metadata } from "next";
import { CtaCard } from "@/components/contact/cta-card";
import { ProfileCard } from "@/components/home/profile-card";
import { Reviews } from "@/components/testimonials/reviews";
import { ButtonLink } from "@/components/ui/button-link";
import { JsonLd } from "@/components/ui/json-ld";
import { ListCard } from "@/components/ui/list-card";
import { PageTitle } from "@/components/ui/page-title";
import { getServices, getSiteConfig } from "@/lib/content";
import { splitClass, splitColumnClass } from "@/lib/grid";
import { getFeaturedProjects, getProjectHref, linksToLiveSite } from "@/lib/projects";
import { createMetadata, homeJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata(await getSiteConfig(), { path: "/" });
}

export default async function HomePage() {
  const [siteConfig, services, featured] = await Promise.all([getSiteConfig(), getServices(), getFeaturedProjects()]);

  return (
    <>
      <JsonLd data={homeJsonLd(siteConfig, services)} />

      <div className={splitClass}>
        <section aria-labelledby="profile-title" className={splitColumnClass}>
          <PageTitle id="profile-title" className="xl:self-end">
            {siteConfig.role}
          </PageTitle>
          <ProfileCard className="xl:self-start" />
        </section>

        <section aria-labelledby="work-title" className={splitColumnClass}>
          <PageTitle
            as="h2"
            id="work-title"
            className="xl:self-end"
            action={
              <ButtonLink href="/work" variant="white" size="sm">
                View all
              </ButtonLink>
            }
          >
            Selected work
          </PageTitle>
          <ListCard
            className="xl:self-start"
            items={featured.map((project) => ({
              key: project.slug,
              icon: <FolderCode />,
              title: project.title,
              lines: [project.category.join(" / "), `${project.year} · ${project.technologies.join(" / ")}`],
              href: getProjectHref(project),
              external: linksToLiveSite(project),
            }))}
          />
        </section>
      </div>

      <Reviews />
      <CtaCard />
    </>
  );
}
