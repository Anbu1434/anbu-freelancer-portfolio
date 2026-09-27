import Link from "next/link";
import { cardClass } from "@/components/ui/card";
import { ProjectVisual } from "@/components/work/project-visual";
import { cn } from "@/lib/cn";
import { getProjectHref, linksToLiveSite } from "@/lib/projects";
import type { Project } from "@/types/project";

/** Whole card is one click target via the stretched title link. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={cn(cardClass("white"), "card-lift group relative flex flex-col")} data-reveal data-cursor="View ↗">
      <div className="border-b-2 border-ink">
        <ProjectVisual project={project} bordered={false} sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="meta flex justify-between gap-3 text-ink/75">
          <span>{project.number}</span>
          <span>{project.year}</span>
        </p>
        <h2 className="title mt-3 text-[clamp(1.375rem,2.2vw,1.75rem)]">
          <Link
            href={getProjectHref(project)}
            {...(linksToLiveSite(project) && { target: "_blank", rel: "noopener noreferrer" })}
            className="after:absolute after:inset-0"
          >
            {project.title}
          </Link>
        </h2>
        <p className="mt-3 text-[0.9375rem] text-ink/80">{project.description}</p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <p className="meta text-ink/75">{project.technologies.join(" / ")}</p>
          <span aria-hidden="true" className="arrow text-lg">
            →
          </span>
        </div>
      </div>
    </article>
  );
}
