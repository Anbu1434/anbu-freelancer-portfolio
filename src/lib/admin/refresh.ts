import { revalidateTag } from "next/cache";
import type { ContentTag } from "@/lib/content";

/** Expires public content immediately so the next visit sees the admin's change. */
export function refresh(...tags: ContentTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
