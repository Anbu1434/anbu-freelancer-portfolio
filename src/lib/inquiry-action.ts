"use server";

import { getSettings } from "@/lib/content";
import type { Settings } from "@/lib/db/schemas";
import { createInquiry, markEmailFailed } from "@/lib/db/inquiries";
import { normalizeInquiry, validateInquiry, type InquiryErrors, type InquiryValues } from "@/lib/inquiry";
import { processInquiry } from "@/lib/inquiry-flow";
import { inquiryNotification, sendEmail } from "@/lib/mail";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const MIN_FILL_MS = 3000;
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export type InquirySubmission = InquiryValues & {
  /** Honeypot — people never see this field. */
  website?: string;
  /** When the modal was first opened (ms since epoch). */
  startedAt: number;
};

export type InquiryResult = { status: "success" } | { status: "invalid"; errors: InquiryErrors } | { status: "error" };

/** The one entry point for project requests; the modal only calls this. */
export async function submitInquiry(submission: InquirySubmission): Promise<InquiryResult> {
  // Report success to bots so they learn nothing.
  if (submission.website) return { status: "success" };

  // Time trap: submitted faster than a person could fill in the steps.
  if (!submission.startedAt || Date.now() - submission.startedAt < MIN_FILL_MS) return { status: "error" };

  let settings: Settings | null = null;
  try {
    settings = await getSettings();
  } catch (error) {
    console.error("[inquiry] Settings unavailable (database down?) — falling back to CONTACT_TO_EMAIL", error);
  }

  const values = normalizeInquiry(submission);
  // Without settings the offered services are unknown; the other fields are still validated.
  const errors = validateInquiry(values, settings?.inquiryServices ?? values.services);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  if (limiter.hit(await clientIp())) return { status: "error" };

  if (!settings) {
    const ownerEmail = process.env.CONTACT_TO_EMAIL;
    const notified = ownerEmail ? await sendEmail(inquiryNotification(values, null, ownerEmail)) : false;
    return notified ? { status: "success" } : { status: "error" };
  }

  const received = await processInquiry(values, { settings, createInquiry, markEmailFailed, sendEmail });
  return received ? { status: "success" } : { status: "error" };
}
