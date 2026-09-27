"use server";

import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { findAdminByEmail } from "@/lib/db/admins";
import { loginSchema } from "@/lib/db/schemas";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

/** The email is echoed back so a failed attempt (React resets the form) keeps it filled in. */
export type LoginState = { error: string; email?: string } | undefined;

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
const invalidCredentials = (email?: string) => ({ error: "Invalid email or password.", email });

// Compared against when the email is unknown, so both failure paths take the same time.
let dummyHash: Promise<string> | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const typedEmail = typeof formData.get("email") === "string" ? String(formData.get("email")).slice(0, 200) : undefined;
  if (!parsed.success) return invalidCredentials(typedEmail);

  const email = parsed.data.email.toLowerCase();
  const ipKey = `ip:${await clientIp()}`;
  // Checked in turn: a limited IP must not be able to add email keys (and so grow the limiter's map).
  if (limiter.hit(ipKey) || limiter.hit(`email:${email}`)) return { error: "Too many attempts. Try again in 15 minutes.", email: typedEmail };

  const admin = await findAdminByEmail(email);
  dummyHash ??= hashPassword("not-the-password");
  const valid = await verifyPassword(parsed.data.password, admin?.passwordHash ?? (await dummyHash));
  if (!admin || !valid) return invalidCredentials(typedEmail);

  // Only failed attempts should count: a successful sign-in clears both counters.
  limiter.reset(ipKey);
  limiter.reset(`email:${email}`);
  await setSessionCookie({ adminId: admin.id, sessionVersion: admin.sessionVersion });
  redirect("/admin");
}
