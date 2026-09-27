"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateInquiryStatus } from "@/app/admin/(panel)/inquiries/actions";
import { statusLabels } from "@/lib/admin/format";
import { inquiryStatuses, type InquiryStatus } from "@/lib/db/schemas";

export function StatusSelect({ id, status }: { id: string; status: InquiryStatus }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 grid gap-2">
      <label htmlFor="inquiry-status" className="sr-only">
        Status
      </label>
      <select
        id="inquiry-status"
        className="field select"
        defaultValue={status}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as InquiryStatus;
          setError("");
          startTransition(async () => {
            const result = await updateInquiryStatus(id, next);
            if (!result.ok) setError(result.error);
            router.refresh();
          });
        }}
      >
        {inquiryStatuses.map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
