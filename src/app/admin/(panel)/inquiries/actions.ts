"use server";

import { failed, invalid, type ActionResult } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/auth/dal";
import { addReply, getInquiry, setInquiryStatus } from "@/lib/db/inquiries";
import { inquiryStatuses, replySchema, type InquiryStatus } from "@/lib/db/schemas";
import { findSettings } from "@/lib/db/settings";
import { sendEmail } from "@/lib/mail";

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!inquiryStatuses.includes(status)) return failed();
  if (!(await setInquiryStatus(id, status))) return failed("This request no longer exists.");
  return { ok: true };
}

/** Emails the client through Resend and records the reply, delivered or not. */
export async function sendReply(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const [inquiry, settings] = await Promise.all([getInquiry(id), findSettings()]);
  if (!inquiry) return failed("This request no longer exists.");

  const delivered = await sendEmail({ to: inquiry.email, subject: parsed.data.subject, text: parsed.data.body, replyTo: settings?.email });
  await addReply(id, { ...parsed.data, delivered });

  return delivered ? { ok: true } : failed("The email could not be sent. The reply was saved as “not delivered” — try again in a moment.");
}
