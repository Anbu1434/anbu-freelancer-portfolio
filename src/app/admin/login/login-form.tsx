"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="meta font-bold">Email</span>
        <input name="email" type="email" autoComplete="username" required className="field" defaultValue={state?.email} key={state?.email} />
      </label>
      <label className="grid gap-1.5">
        <span className="meta font-bold">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </label>
      {state?.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-accent" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
