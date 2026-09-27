"use server";

import { fromDbError, invalid, type ActionResult } from "@/lib/admin/action-result";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import { settingsSchema } from "@/lib/db/schemas";
import { saveSettings } from "@/lib/db/settings";
import { deleteReplacedImages } from "@/lib/imagekit";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const previous = await saveSettings(parsed.data);
    await deleteReplacedImages([previous?.portrait], [parsed.data.portrait]);
    refresh("settings");
    return { ok: true };
  } catch (error) {
    return fromDbError(error);
  }
}
