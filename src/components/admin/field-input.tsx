"use client";

import type { ReactNode } from "react";
import type { FieldConfig } from "@/components/admin/field-configs";
import { ImageField } from "@/components/admin/image-field";
import type { ImageRef } from "@/lib/db/schemas";

type Props = { id: string; field: FieldConfig; value: unknown; error?: string; onChange: (value: unknown) => void };

export function FieldInput({ id, field, value, error, onChange }: Props) {
  const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined };

  let control: ReactNode;
  switch (field.type) {
    case "text":
    case "email":
    case "url":
      control = (
        <input {...common} type={field.type} className="field" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)} />
      );
      break;
    case "textarea":
      control = (
        <textarea {...common} rows={field.rows ?? 4} className="field" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)} />
      );
      break;
    case "number":
      control = (
        <input
          {...common}
          type="number"
          className="field max-w-40"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
      );
      break;
    case "toggle":
      control = (
        <input {...common} type="checkbox" className="size-5 accent-[var(--accent)]" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      );
      break;
    case "select":
      control = (
        <select {...common} className="field select" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "checkboxes": {
      const checked = (value as string[] | undefined) ?? [];
      control = (
        <div className="flex flex-wrap gap-x-5 gap-y-2" id={id} role="group" aria-describedby={describedBy}>
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={checked.includes(option)}
                onChange={(event) => onChange(event.target.checked ? [...checked, option] : checked.filter((item) => item !== option))}
              />
              {option}
            </label>
          ))}
        </div>
      );
      break;
    }
    case "image":
      control = <ImageField id={id} folder={field.folder} value={value as ImageRef | undefined} onChange={onChange} />;
      break;
    case "images": {
      const images = (value as ImageRef[] | undefined) ?? [];
      control = (
        <div className="grid gap-4" id={id} role="group" aria-describedby={describedBy}>
          {images.map((image, index) => (
            <div key={image.fileId} className="grid gap-2 border-2 border-ink bg-paper p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="meta font-bold">{index === 0 ? "Cover" : `Image ${index + 1}`}</p>
                {index > 0 && (
                  <button type="button" className="btn btn-white btn-sm" onClick={() => onChange([image, ...images.filter((_, i) => i !== index)])}>
                    Make cover
                  </button>
                )}
              </div>
              <ImageField
                id={`${id}-${index}`}
                folder={field.folder}
                value={image}
                onChange={(next) => onChange(next ? images.map((current, i) => (i === index ? next : current)) : images.filter((_, i) => i !== index))}
              />
            </div>
          ))}
          {images.length < field.max && (
            <ImageField id={`${id}-new`} folder={field.folder} value={undefined} onChange={(next) => next && onChange([...images, next])} />
          )}
        </div>
      );
      break;
    }
    case "list": {
      const items = (value as string[] | undefined) ?? [];
      const set = (next: string[]) => onChange(next);
      control = (
        <div className="grid gap-2" id={id} aria-describedby={describedBy}>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              {field.multiline ? (
                <textarea
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  rows={3}
                  className="field flex-1"
                  value={item}
                  onChange={(event) => set(items.map((current, i) => (i === index ? event.target.value : current)))}
                />
              ) : (
                <input
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  className="field flex-1"
                  value={item}
                  onChange={(event) => set(items.map((current, i) => (i === index ? event.target.value : current)))}
                />
              )}
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remove ${field.itemLabel.toLowerCase()} ${index + 1}`} onClick={() => set(items.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-white btn-sm justify-self-start" onClick={() => set([...items, ""])}>
            Add {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
      break;
    }
    case "pairs": {
      const [first, second] = field.keys;
      const rows = (value as Record<string, string>[] | undefined) ?? [];
      const set = (next: Record<string, string>[]) => onChange(next);
      const edit = (index: number, key: string, text: string) => set(rows.map((row, i) => (i === index ? { ...row, [key]: text } : row)));
      control = (
        <div className="grid gap-2" id={id} aria-describedby={describedBy}>
          {rows.map((row, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <input aria-label={`${field.keyLabels[0]} ${index + 1}`} placeholder={field.keyLabels[0]} className="field flex-1" value={row[first] ?? ""} onChange={(event) => edit(index, first, event.target.value)} />
              <input aria-label={`${field.keyLabels[1]} ${index + 1}`} placeholder={field.keyLabels[1]} className="field w-32" value={row[second] ?? ""} onChange={(event) => edit(index, second, event.target.value)} />
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remove row ${index + 1}`} onClick={() => set(rows.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-white btn-sm justify-self-start" onClick={() => set([...rows, { [first]: "", [second]: "" }])}>
            Add row
          </button>
        </div>
      );
      break;
    }
  }

  return (
    <div className={field.type === "toggle" ? "flex flex-row-reverse items-center justify-end gap-3" : "grid gap-1.5"}>
      <label htmlFor={id} className="text-sm font-bold">
        {field.label}
      </label>
      {control}
      {field.hint && (
        <p id={`${id}-hint`} className="text-sm text-ink/70">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
