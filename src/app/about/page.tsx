import { BriefcaseBusiness } from "lucide-react";
import { AboutCard } from "@/components/about/about-card";
import { TechCard } from "@/components/about/tech-card";
import { CtaCard } from "@/components/contact/cta-card";
import { ListCard } from "@/components/ui/list-card";
import { PageTitle } from "@/components/ui/page-title";
import { experience } from "@/content/experience";
import { siteConfig } from "@/content/site";
import { stack } from "@/content/stack";
import { splitClass, splitColumnClass } from "@/lib/grid";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About",
  description: `${siteConfig.role} focused on web, product UI, and AI. Based in ${siteConfig.location}.`,
  path: "/about",
});

export default function AboutPage() {
  const hasExperience = experience.length > 0;
  const columnClass = hasExperience ? splitColumnClass : "flex flex-col gap-6 lg:gap-8";

  return (
    <>
      <div className={hasExperience ? splitClass : undefined}>
        <section aria-labelledby="about-title" className={columnClass}>
          <PageTitle id="about-title" className="xl:self-end">
            About
          </PageTitle>
          <AboutCard className="xl:self-start" />
        </section>

        {hasExperience && (
          <section aria-labelledby="experience-title" className={splitColumnClass}>
            <PageTitle as="h2" id="experience-title" className="xl:self-end">
              Experience
            </PageTitle>
            <ListCard
              className="xl:self-start"
              items={experience.map((item) => ({
                key: `${item.role}-${item.period}`,
                icon: <BriefcaseBusiness />,
                title: item.role,
                lines: [item.company, item.period],
              }))}
            />
          </section>
        )}
      </div>

      <section aria-labelledby="tech-title" className="mt-14 lg:mt-16">
        <PageTitle as="h2" id="tech-title">
          Technology
        </PageTitle>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:mt-8 xl:grid-cols-4">
          {stack.map((group, index) => (
            <TechCard key={group.label} group={group} tone={index === 0 ? "tint" : "white"} />
          ))}
        </div>
      </section>

      <CtaCard />
    </>
  );
}
