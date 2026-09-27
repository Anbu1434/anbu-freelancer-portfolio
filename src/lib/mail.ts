import { siteConfig } from "@/content/site";
import type { InquiryValues } from "@/lib/inquiry";

/**
 * Sends a project request through Resend's REST API (no SDK dependency).
 * Without RESEND_API_KEY the request is logged in development and rejected in production,
 * so a missing key can never silently swallow a real enquiry.
 */
export async function sendInquiryEmail(values: InquiryValues): Promise<boolean> {
  const text = [
    `Name: ${values.name}`,
    `Phone / WhatsApp: ${values.phone}`,
    `Services: ${values.services.join(", ")}`,
    "",
    values.businessDetails,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[inquiry] RESEND_API_KEY not set — logging instead of sending:\n${text}`);
      return true;
    }
    console.error("[inquiry] RESEND_API_KEY is not set; project request was not delivered.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [process.env.CONTACT_TO_EMAIL ?? siteConfig.email],
        subject: `New project request — ${values.name.replace(/[\r\n]+/g, " ")}`,
        text,
      }),
    });

    if (!response.ok) {
      console.error("[inquiry] Resend responded with", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[inquiry] Failed to reach Resend", error);
    return false;
  }
}
