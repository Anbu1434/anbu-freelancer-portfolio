"use server";

import { invalid } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { findAdminById, updatePassword } from "@/lib/db/admins";
import { passwordChangeSchema } from "@/lib/db/schemas";

export type PasswordState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

/** Changing the password bumps sessionVersion, which signs out every other session; this one gets a fresh cookie. */
export async function changePassword(_state: PasswordState, formData: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const result = invalid(parsed.error);
    return result.ok ? undefined : { error: result.error, fieldErrors: result.fieldErrors };
  }

  const record = await findAdminById(admin.id);
  if (!record || !(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { error: "Password not changed.", fieldErrors: { current: "Current password is incorrect." } };
  }

  const sessionVersion = await updatePassword(admin.id, await hashPassword(parsed.data.next));
  if (sessionVersion === null) return { error: "Password not changed." };
  await setSessionCookie({ adminId: admin.id, sessionVersion });
  return { ok: true };
}
