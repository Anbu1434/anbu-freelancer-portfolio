"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/admin/(panel)/account/actions";

const fields = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  { name: "next", label: "New password (12+ characters)", autoComplete: "new-password" },
  { name: "confirm", label: "Repeat new password", autoComplete: "new-password" },
] as const;

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} className="grid max-w-md gap-4" noValidate>
      {fields.map((field) => {
        const error = state?.fieldErrors?.[field.name];
        return (
          <label key={field.name} className="grid gap-1.5">
            <span className="text-sm font-bold">{field.label}</span>
            <input name={field.name} type="password" autoComplete={field.autoComplete} className="field" aria-invalid={error ? true : undefined} />
            {error && <span className="field-error">{error}</span>}
          </label>
        );
      })}
      {state?.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="meta font-bold">
          Password changed. Other devices have been signed out.
        </p>
      )}
      <button type="submit" className="btn btn-accent justify-self-start" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
