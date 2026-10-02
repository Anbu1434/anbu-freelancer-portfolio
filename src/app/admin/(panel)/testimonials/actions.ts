"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { testimonialSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.testimonials, schema: testimonialSchema, tags: ["testimonials"], imageFields: ["avatar"] });

export async function createTestimonial(input: unknown) {
  return actions.create(input);
}
export async function updateTestimonial(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteTestimonial(id: string) {
  return actions.remove(id);
}
export async function moveTestimonial(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
