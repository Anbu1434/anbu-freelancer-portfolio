import type { ZodError } from "zod";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Field errors keyed by dotted path ("hero.accentLine", "includes.2"), first message per path. */
export function invalid(error: ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

export function failed(error = "Something went wrong. Please try again."): ActionResult {
  return { ok: false, error };
}

export function fromDbError(error: unknown): ActionResult {
  if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
    return { ok: false, error: "That slug is already used by another project.", fieldErrors: { slug: "Already in use." } };
  }
  console.error("[admin] Database write failed", error);
  return failed("Couldn't save — the database didn't respond. Your changes are still in the form.");
}
