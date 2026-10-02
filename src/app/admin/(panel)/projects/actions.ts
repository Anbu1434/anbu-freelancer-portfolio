"use server";

import { failed, type ActionResult } from "@/lib/admin/action-result";
import { collectionActions } from "@/lib/admin/collection-actions";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";
import { projectSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.projects, schema: projectSchema, tags: ["projects"], imageFields: ["images"] });

export async function createProject(input: unknown) {
  return actions.create(input);
}
export async function updateProject(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteProject(id: string) {
  return actions.remove(id);
}
export async function moveProject(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}

export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (typeof featured !== "boolean") return failed();
  if (!(await repos.projects.patch(id, { featured }))) return failed("This project no longer exists. Reload the page.");
  refresh("projects");
  return { ok: true };
}
