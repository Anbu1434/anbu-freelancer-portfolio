"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { stackGroupSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.stackGroups, schema: stackGroupSchema, tags: ["stack"] });

export async function createStackGroup(input: unknown) {
  return actions.create(input);
}
export async function updateStackGroup(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteStackGroup(id: string) {
  return actions.remove(id);
}
export async function moveStackGroup(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
