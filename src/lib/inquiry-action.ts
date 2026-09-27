"use server";

import { headers } from "next/headers";
import { normalizeInquiry, validateInquiry, type InquiryErrors, type InquiryValues } from "@/lib/inquiry";
import { sendInquiryEmail } from "@/lib/mail";

const MIN_FILL_MS = 3000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export type InquirySubmission = InquiryValues & {
  /** Honeypot — people never see this field. */
  website?: string;
  /** When the modal was first opened (ms since epoch). */
  startedAt: number;
};

export type InquiryResult = { status: "success" } | { status: "invalid"; errors: InquiryErrors } | { status: "error" };

// Best-effort, per-instance rate limit. Good enough to blunt casual abuse on a portfolio.
const recentSubmissions = new Map<string, number[]>();

function isRateLimited(key: string) {
  const now = Date.now();
  if (recentSubmissions.size > 1000) recentSubmissions.clear();

  const recent = (recentSubmissions.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  const limited = recent.length >= MAX_PER_WINDOW;
  if (!limited) recent.push(now);
  recentSubmissions.set(key, recent);
  return limited;
}

/**
 * The one entry point for project requests. The modal only calls this; swap `sendInquiryEmail`
 * for a CRM or database call without touching the UI.
 */
export async function submitInquiry(submission: InquirySubmission): Promise<InquiryResult> {
  // Report success to bots so they learn nothing.
  if (submission.website) return { status: "success" };

  // Time trap: submitted faster than a person could fill in four steps.
  if (!submission.startedAt || Date.now() - submission.startedAt < MIN_FILL_MS) return { status: "error" };

  const values = normalizeInquiry(submission);
  const errors = validateInquiry(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip)) return { status: "error" };

  const sent = await sendInquiryEmail(values);
  return sent ? { status: "success" } : { status: "error" };
}
