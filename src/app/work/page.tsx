import { CtaCard } from "@/components/contact/cta-card";
import { PageTitle } from "@/components/ui/page-title";
import { ProjectCard } from "@/components/work/project-card";
import { pad } from "@/lib/cn";
import { projects } from "@/lib/projects";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Work",
  description: "Selected projects across web applications, product UI, and AI.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <>
      <PageTitle eyebrow={`${pad(projects.length)} projects`}>Selected work</PageTitle>
      <p className="mt-4 max-w-[52ch] text-lead text-ink/80">
        Selected projects across web applications, product UI, and AI.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:mt-10 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
      <CtaCard />
    </>
  );
}
