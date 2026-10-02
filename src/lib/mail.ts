import type { Settings } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";
import { absoluteUrl } from "@/lib/seo";

export type OutgoingEmail = { to: string; subject: string; text: string; replyTo?: string };

// Header values must never carry line breaks.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Sends through Resend's REST API (no SDK dependency).
 * Without RESEND_API_KEY the email is logged in development and rejected in production,
 * so a missing key can never silently swallow a real message.
 */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] RESEND_API_KEY not set — logging instead of sending:\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
      return true;
    }
    console.error("[mail] RESEND_API_KEY is not set; email was not sent.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [email.to],
        subject: oneLine(email.subject),
        text: email.text,
        ...(email.replyTo && { reply_to: oneLine(email.replyTo) }),
      }),
    });

    if (!response.ok) {
      console.error("[mail] Resend responded with", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mail] Failed to reach Resend", error);
    return false;
  }
}

function requestSummary(values: InquiryValues) {
  return [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone / WhatsApp: ${values.phone}`,
    `Services: ${values.services.join(", ")}`,
    "",
    values.businessDetails,
  ];
}

export function inquiryNotification(values: InquiryValues, inquiryId: string | null, ownerEmail: string): OutgoingEmail {
  const footer = inquiryId
    ? `Open in admin: ${absoluteUrl(`/admin/inquiries/${inquiryId}`)}`
    : "This request could not be saved to the database — reply to this email directly.";

  return {
    to: process.env.CONTACT_TO_EMAIL || ownerEmail,
    subject: `New project request — ${oneLine(values.name)}`,
    replyTo: values.email,
    text: [...requestSummary(values), "", footer].join("\n"),
  };
}

export function inquiryAutoReply(
  values: InquiryValues,
  settings: Pick<Settings, "brand" | "name" | "email" | "autoReplyMessage">,
): OutgoingEmail {
  return {
    to: values.email,
    replyTo: settings.email,
    subject: `We received your project request — ${settings.brand}`,
    // Only the owner's text and the validated service names: echoing what the visitor typed would let
    // anyone send arbitrary content to any address from this domain.
    text: [
      "Hi,",
      "",
      settings.autoReplyMessage,
      "",
      `Services requested: ${values.services.join(", ")}`,
      "",
      `— ${settings.name}`,
    ].join("\n"),
  };
}
