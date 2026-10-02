import type { Settings } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";
import { inquiryAutoReply, inquiryNotification, type OutgoingEmail } from "@/lib/mail";

export type InquiryDeps = {
  settings: Pick<Settings, "brand" | "name" | "email" | "autoReplyMessage">;
  createInquiry: (values: InquiryValues) => Promise<string>;
  markEmailFailed: (id: string) => Promise<void>;
  sendEmail: (email: OutgoingEmail) => Promise<boolean>;
};

/**
 * Save first, then email. The request counts as received if it was saved OR the owner was emailed;
 * a saved request whose emails failed is flagged so it stands out in the admin inbox.
 */
export async function processInquiry(values: InquiryValues, deps: InquiryDeps): Promise<boolean> {
  let id: string | null = null;
  try {
    id = await deps.createInquiry(values);
  } catch (error) {
    console.error("[inquiry] Failed to save to the database", error);
  }

  const notified = await deps.sendEmail(inquiryNotification(values, id, deps.settings.email));
  const acknowledged = await deps.sendEmail(inquiryAutoReply(values, deps.settings));

  if (id && (!notified || !acknowledged)) {
    await deps.markEmailFailed(id).catch((error) => console.error("[inquiry] Failed to flag email failure", error));
  }

  return Boolean(id) || notified;
}
