import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, type SessionPayload } from "@/lib/auth/session";

export async function setSessionCookie(payload: SessionPayload) {
  (await cookies()).set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
