import { FolderCode } from "lucide-react";
import { CtaCard } from "@/components/contact/cta-card";
import { ProfileCard } from "@/components/home/profile-card";
import { Reviews } from "@/components/testimonials/reviews";
import { ButtonLink } from "@/components/ui/button-link";
import { JsonLd } from "@/components/ui/json-ld";
import { ListCard } from "@/components/ui/list-card";
import { PageTitle } from "@/components/ui/page-title";
import { siteConfig } from "@/content/site";
import { splitClass, splitColumnClass } from "@/lib/grid";
import { getFeaturedProjects, getProjectHref, linksToLiveSite } from "@/lib/projects";
import { createMetadata, homeJsonLd } from "@/lib/seo";

export const metadata = createMetadata({ path: "/" });

export default function HomePage() {
  const featured = getFeaturedProjects();

  return (
    <>
      <JsonLd data={homeJsonLd()} />

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
