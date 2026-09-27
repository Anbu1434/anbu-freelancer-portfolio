"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EntityForm } from "@/components/admin/entity-form";
import type { FormSection } from "@/components/admin/field-configs";
import { cardClass } from "@/components/ui/card";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/cn";

type Values = Record<string, unknown>;

type Props = {
  items: { id: string; values: Values }[];
  sections: FormSection[];
  empty: Values;
  titleField: string;
  subtitleField?: string;
  noun: string;
  create: (values: Values) => Promise<ActionResult>;
  update: (id: string, values: Values) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
  move: (id: string, direction: "up" | "down") => Promise<ActionResult>;
};

/** Inline add / edit / delete / reorder for a small ordered collection. */
export function OrderedListEditor({ items, sections, empty, titleField, subtitleField, noun, create, update, remove, move }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
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

      {items.length === 0 && <p className="text-ink/70">No {noun}s yet.</p>}

      <ol className="grid gap-4">
        {items.map((item, index) => (
          <li key={item.id} className={cn(cardClass("white"), "p-4 sm:p-5")}>
            {editing === item.id ? (
              <EntityForm
                sections={sections}
                initial={item.values}
                action={(values) => update(item.id, values)}
                onDone={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{String(item.values[titleField] ?? "")}</p>
                  {subtitleField && <p className="text-sm text-ink/70">{String(item.values[subtitleField] ?? "")}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="icon-btn bg-white" aria-label={`Move ${noun} up`} disabled={pending || index === 0} onClick={() => run(() => move(item.id, "up"))}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn bg-white" aria-label={`Move ${noun} down`} disabled={pending || index === items.length - 1} onClick={() => run(() => move(item.id, "down"))}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn bg-tint" aria-label={`Edit ${noun}`} onClick={() => setEditing(item.id)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn bg-accent"
                    aria-label={`Delete ${noun}`}
                    disabled={pending}
                    onClick={() => window.confirm(`Delete this ${noun}? This can't be undone.`) && run(() => remove(item.id))}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      {editing === "new" ? (
        <div className={cn(cardClass("tint"), "p-4 sm:p-5")}>
          <EntityForm sections={sections} initial={empty} action={create} submitLabel={`Add ${noun}`} resetOnSuccess onDone={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" className="btn btn-primary justify-self-start" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Add {noun}
        </button>
      )}
    </div>
  );
}
