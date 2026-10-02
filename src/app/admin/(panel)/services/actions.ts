"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { serviceSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.services, schema: serviceSchema, tags: ["services"] });

export async function createService(input: unknown) {
  return actions.create(input);
}
export async function updateService(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteService(id: string) {
  return actions.remove(id);
}
export async function moveService(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
