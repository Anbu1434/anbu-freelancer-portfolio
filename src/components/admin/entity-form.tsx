"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import type { FormSection } from "@/components/admin/field-configs";
import { FieldInput } from "@/components/admin/field-input";
import type { ActionResult } from "@/lib/admin/action-result";
import { getPath, setPath } from "@/lib/admin/paths";

type Values = Record<string, unknown>;

type Props = {
  sections: FormSection[];
  initial: Values;
  action: (values: Values) => Promise<ActionResult>;
  submitLabel?: string;
  /** After a successful create, navigate to this prefix + the new id. */
  redirectOnCreate?: string;
  resetOnSuccess?: boolean;
  onDone?: () => void;
};

/** Error for a field, including nested ones like "includes.2" or "metrics.0.value". */
function errorFor(errors: Record<string, string>, name: string) {
  return errors[name] ?? Object.entries(errors).find(([key]) => key.startsWith(`${name}.`))?.[1];
}

export function EntityForm({ sections, initial, action, submitLabel = "Save", redirectOnCreate, resetOnSuccess, onDone }: Props) {
  const router = useRouter();
  const formId = useId();
  const [values, setValues] = useState<Values>(initial);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await action(values).catch((): ActionResult => ({ ok: false, error: "Couldn't reach the server. Try again." }));
      setResult(response);
      if (!response.ok) return;
      if (redirectOnCreate && response.id) return router.push(`${redirectOnCreate}${response.id}`);
      if (resetOnSuccess) setValues(initial);
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      {sections.map((section, index) => (
        <fieldset key={section.title ?? index} className="grid gap-5">
          {section.title && <legend className="meta mb-4 font-bold">{section.title}</legend>}
          {section.fields.map((field) => (
            <FieldInput
              key={field.name}
              id={`${formId}-${field.name}`}
              field={field}
              value={getPath(values, field.name)}
              error={errorFor(errors, field.name)}
              onChange={(value) => setValues((current) => setPath(current, field.name, value))}
            />
          ))}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-accent" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {onDone && (
          <button type="button" className="btn btn-secondary" onClick={onDone} disabled={pending}>
            Cancel
          </button>
        )}
        {result && !result.ok && (
          <p role="alert" className="field-error">
            {result.error}
          </p>
        )}
        {result?.ok && !pending && (
          <p role="status" className="meta font-bold">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
