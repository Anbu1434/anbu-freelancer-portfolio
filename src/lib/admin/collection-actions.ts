import type { z } from "zod";
import { failed, fromDbError, invalid, type ActionResult } from "@/lib/admin/action-result";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import type { ContentTag } from "@/lib/content";
import type { OrderedRepo } from "@/lib/db/ordered-repo";
import type { ImageRef } from "@/lib/db/schemas";
import { deleteReplacedImages } from "@/lib/imagekit";

type Options<S extends z.ZodType<object>> = {
  repo: OrderedRepo<z.output<S>>;
  schema: S;
  tags: ContentTag[];
  /** Top-level fields holding an ImageRef; replaced or removed files are deleted from ImageKit. */
  imageFields?: string[];
};

/**
 * CRUD + reorder actions for one ordered collection. Wrap each method in an exported
 * async function inside a "use server" file — only those can be called from the browser.
 */
export function collectionActions<S extends z.ZodType<object>>({ repo, schema, tags, imageFields = [] }: Options<S>) {
  const imagesOf = (doc: object | null) => imageFields.map((field) => (doc as Record<string, ImageRef | undefined> | null)?.[field]);

  return {
    async create(input: unknown): Promise<ActionResult> {
      await requireAdmin();
      const parsed = schema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      try {
        const id = await repo.create(parsed.data);
        refresh(...tags);
        return { ok: true, id };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async update(id: string, input: unknown): Promise<ActionResult> {
      await requireAdmin();
      const parsed = schema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      try {
        const result = await repo.update(id, parsed.data);
        if (!result) return failed("This item no longer exists. Reload the page.");
        await deleteReplacedImages(imagesOf(result.before), imagesOf(result.after));
        refresh(...tags);
        return { ok: true, id };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async remove(id: string): Promise<ActionResult> {
      await requireAdmin();
      try {
        const removed = await repo.remove(id);
        if (removed) await deleteReplacedImages(imagesOf(removed), []);
        refresh(...tags);
        return { ok: true };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async move(id: string, direction: "up" | "down"): Promise<ActionResult> {
      await requireAdmin();
      if (direction !== "up" && direction !== "down") return failed();
      try {
        await repo.move(id, direction);
        refresh(...tags);
        return { ok: true };
      } catch (error) {
        return fromDbError(error);
      }
    },
  };
}
