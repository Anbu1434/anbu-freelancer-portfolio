"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, moveProject, setProjectFeatured } from "@/app/admin/(panel)/projects/actions";
import { cardClass } from "@/components/ui/card";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/cn";

type Row = { id: string; title: string; slug: string; category: string[]; featured: boolean };

export function ProjectList({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    setError("");
    startTransition(async () => {
      const result = await task().catch((): ActionResult => ({ ok: false, error: "Couldn't reach the server." }));
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-4">
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {projects.length === 0 && <p className="text-ink/70">No projects yet.</p>}
      <ol className="grid gap-4">
        {projects.map((project, index) => (
          <li key={project.id} className={cn(cardClass("white"), "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{project.title}</p>
              <p className="meta text-ink/70">
                /work/{project.slug} · {project.category.join(" / ")}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={project.featured}
                disabled={pending}
                onChange={(event) => run(() => setProjectFeatured(project.id, event.target.checked))}
              />
              Featured
            </label>
            <div className="flex gap-2">
              <button type="button" className="icon-btn bg-white" aria-label={`Move ${project.title} up`} disabled={pending || index === 0} onClick={() => run(() => moveProject(project.id, "up"))}>
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn bg-white"
                aria-label={`Move ${project.title} down`}
                disabled={pending || index === projects.length - 1}
                onClick={() => run(() => moveProject(project.id, "down"))}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <Link href={`/admin/projects/${project.id}`} className="icon-btn bg-tint" aria-label={`Edit ${project.title}`}>
                <Pencil aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="icon-btn bg-accent"
                aria-label={`Delete ${project.title}`}
                disabled={pending}
                onClick={() => window.confirm(`Delete “${project.title}”? This can't be undone.`) && run(() => deleteProject(project.id))}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
