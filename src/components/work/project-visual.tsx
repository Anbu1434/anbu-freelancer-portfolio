import { ImageCarousel } from "@/components/work/image-carousel";
import { cn } from "@/lib/cn";
import type { Project } from "@/types/project";

type ProjectVisualProps = {
  project: Project;
  sizes: string;
  preload?: boolean;
  bordered?: boolean;
  className?: string;
};

export function ProjectVisual({ project, sizes, preload, bordered = true, className }: ProjectVisualProps) {
  const images = (project.images ?? []).map((image) => ({ src: image.src, alt: image.alt ?? `${project.title} interface` }));
  return (
    <div className={cn("relative aspect-[16/10] overflow-clip bg-paper-muted", bordered && "border-2 border-ink", className)}>
      <div className="absolute inset-0 transition-transform duration-400 ease-brutal group-hover:scale-[1.03]">
        {images.length > 0 ? <ImageCarousel images={images} sizes={sizes} preload={preload} /> : <Placeholder project={project} />}
      </div>
    </div>
  );
}

/** Typography-led stand-in used until a real screenshot is supplied. */
function Placeholder({ project }: { project: Project }) {
  return (
    <div aria-hidden="true" className="placeholder-grid flex h-full w-full flex-col justify-between p-4 sm:p-5">
      <div className="meta flex justify-between gap-4 font-semibold">
        <span>{project.number}</span>
        <span className="text-right">{project.category.join(" / ")}</span>
      </div>
      <p className="title text-[clamp(1.5rem,3.5vw,3rem)]">{project.title}</p>
    </div>
  );
}
