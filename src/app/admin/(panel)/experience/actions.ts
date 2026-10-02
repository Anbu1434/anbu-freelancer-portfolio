"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { experienceSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.experience, schema: experienceSchema, tags: ["experience"] });

export async function createExperience(input: unknown) {
  return actions.create(input);
}
export async function updateExperience(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteExperience(id: string) {
  return actions.remove(id);
}
export async function moveExperience(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
