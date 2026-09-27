import { BriefcaseBusiness, CalendarDays, Code, ExternalLink, Layers, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, cardClass } from "@/components/ui/card";
import { JsonLd } from "@/components/ui/json-ld";
import { ListCard, type ListCardItem } from "@/components/ui/list-card";
import { PageTitle } from "@/components/ui/page-title";
import { ProjectVisual } from "@/components/work/project-visual";
import { cn, pad } from "@/lib/cn";
import { splitClass, splitColumnClass } from "@/lib/grid";
import { caseStudyProjects, getNextProject, getProject } from "@/lib/projects";
import { createMetadata, projectJsonLd } from "@/lib/seo";
import type { Project } from "@/types/project";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudyProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return createMetadata({ title: project.title, description: project.description, path: `/work/${slug}` });
}

type Section = { label: string; body: ReactNode; wide?: boolean };

function buildSections(project: Project) {
  const sections: Section[] = [];
  const text = (value: string) => <p>{value}</p>;

  if (project.overview) sections.push({ label: "Overview", body: text(project.overview), wide: true });
  if (project.problem) sections.push({ label: "Problem", body: text(project.problem) });
  if (project.approach) sections.push({ label: "Approach", body: text(project.approach) });
  if (project.features?.length) {
    sections.push({
      label: "Features",
      wide: true,
      body: (
        <ol className="grid gap-3 sm:grid-cols-2">
          {project.features.map((feature, index) => (
            <li key={feature} className="flex gap-3 border-2 border-ink bg-paper p-3">
              <span className="meta pt-1 font-bold">{pad(index + 1)}</span>
              <span>{feature}</span>
            </li>
          ))}
        </ol>
      ),
    });
  }
  if (project.engineering) sections.push({ label: "Design / Engineering", body: text(project.engineering) });
  if (project.result) sections.push({ label: "Result", body: text(project.result) });
  if (project.metrics?.length) {
    sections.push({
      label: "Metrics",
      wide: true,
      body: (
        <dl className="grid gap-3 sm:grid-cols-3">
          {project.metrics.map((metric) => (
            <div key={metric.label} className="tile flex flex-col-reverse">
              <dt className="text-sm">{metric.label}</dt>
              <dd className="title text-3xl">{metric.value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  sections.push({
    label: "Tech stack",
    body: (
      <ul className="flex flex-wrap gap-2">
        {project.technologies.map((technology) => (
          <li key={technology} className="border-2 border-ink bg-paper px-3 py-1.5 text-sm font-bold">
            {technology}
          </li>
        ))}
      </ul>
    ),
  });

  return sections;
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(slug);
  const sections = buildSections(project);

  const details: ListCardItem[] = [
    ...(project.role ? [{ key: "role", icon: <UserRound />, title: "Role", lines: [project.role] }] : []),
    ...(project.client ? [{ key: "client", icon: <BriefcaseBusiness />, title: "Client", lines: [project.client] }] : []),
    { key: "stack", icon: <Code />, title: "Stack", lines: [project.technologies.join(" / ")] },
    { key: "category", icon: <Layers />, title: "Category", lines: [project.category.join(" / ")] },
    { key: "year", icon: <CalendarDays />, title: "Year", lines: [project.year] },
  ];

  const tiles = [
    { value: project.year, label: "Year" },
    { value: pad(project.technologies.length), label: "Technologies" },
    ...(project.features?.length ? [{ value: pad(project.features.length), label: "Key features" }] : []),
  ];

  return (
    <>
      <JsonLd data={projectJsonLd(project)} />

      <div className={splitClass}>
        <section aria-labelledby="project-title" className={splitColumnClass}>
          <PageTitle id="project-title" className="xl:self-end">
            {project.title}
          </PageTitle>
          <Card tone="accent" className="p-4 sm:p-5 xl:self-start" data-reveal>
            <ProjectVisual project={project} preload sizes="(min-width: 1280px) 55vw, 100vw" />
            <p className="meta mt-5 font-bold">
              {project.number} / {project.year}
            </p>
            <p className="mt-2 text-lead">{project.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {tiles.map((tile) => (
                <div key={tile.label} className="tile flex flex-col-reverse">
                  <dt className="text-xs font-medium">{tile.label}</dt>
                  <dd className="text-xl font-bold leading-tight">{tile.value}</dd>
                </div>
              ))}
            </dl>
            {(project.liveUrl || project.githubUrl) && (
              <div className="mt-5 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <ButtonLink href={project.liveUrl} icon={<ExternalLink />}>
                    Visit live site
                  </ButtonLink>
                )}
                {project.githubUrl && (
                  <ButtonLink href={project.githubUrl} variant="secondary" icon={<Code />}>
                    Source code
                  </ButtonLink>
                )}
              </div>
            )}
          </Card>
        </section>

        <section aria-labelledby="details-title" className={splitColumnClass}>
          <PageTitle as="h2" id="details-title" className="xl:self-end">
            Project details
          </PageTitle>
          <ListCard className="xl:self-start" items={details} />
        </section>
      </div>

      <section aria-labelledby="case-title" className="mt-14 lg:mt-16">
        <PageTitle as="h2" id="case-title">
          Case study
        </PageTitle>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:mt-8">
          {sections.map((section, index) => (
            <article
              key={section.label}
              className={cn(cardClass(index === 0 ? "tint" : "white"), "p-5 sm:p-6", section.wide && "md:col-span-2")}
              data-reveal
            >
              <h3 className="meta font-bold">
                ({pad(index + 1)}) {section.label}
              </h3>
              <div className="mt-4 text-[1.0625rem] leading-relaxed">{section.body}</div>
            </article>
          ))}
        </div>
      </section>

      {next && (
        <div className={cn(cardClass("accent"), "card-lift group relative mt-14 p-6 sm:p-8 lg:mt-16")} data-cursor="Next ↗">
          <p className="meta flex justify-between gap-4 font-bold">
            <span>Next project</span>
            <span>{next.number}</span>
          </p>
          <p className="title mt-6 flex items-end justify-between gap-6 text-[clamp(1.75rem,4vw,3rem)]">
            <Link href={`/work/${next.slug}`} className="after:absolute after:inset-0">
              {next.title}
            </Link>
            <span aria-hidden="true" className="arrow">
              →
            </span>
          </p>
        </div>
      )}
    </>
  );
}
