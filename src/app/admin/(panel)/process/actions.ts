"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { processStepSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.processSteps, schema: processStepSchema, tags: ["process"] });

export async function createProcessStep(input: unknown) {
  return actions.create(input);
}
export async function updateProcessStep(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteProcessStep(id: string) {
  return actions.remove(id);
}
export async function moveProcessStep(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
