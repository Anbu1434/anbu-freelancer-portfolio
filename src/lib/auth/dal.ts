import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { findAdminById, type Admin } from "@/lib/db/admins";

export type AdminIdentity = { id: string; email: string };

/** A session is valid only if the JWT verifies AND its version matches the account (password changes bump it). */
export async function resolveAdmin(
  token: string | undefined,
  findById: (id: string) => Promise<Admin | null>,
): Promise<AdminIdentity | null> {
  const session = await verifySession(token);
  if (!session) return null;
  const admin = await findById(session.adminId);
  if (!admin || admin.sessionVersion !== session.sessionVersion) return null;
  return { id: admin.id, email: admin.email };
}

export const getAdmin = cache(async () => resolveAdmin((await cookies()).get(SESSION_COOKIE)?.value, findAdminById));

/** Call first in every admin page and Server Action. Layouts alone are not enough: they don't re-run on navigation. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
