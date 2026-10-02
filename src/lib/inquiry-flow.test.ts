import { describe, expect, it, vi } from "vitest";
import { processInquiry } from "@/lib/inquiry-flow";
import type { OutgoingEmail } from "@/lib/mail";

const values = { name: "Ada", email: "ada@example.com", phone: "123 4567", services: ["SEO"], businessDetails: "Details here." };
const settings = { brand: "AnbuDev", name: "Anbu", email: "owner@x.y", autoReplyMessage: "Thanks!" };

/** `emails` are the results of the owner notification and the client auto-reply, in that order. */
function deps({ saved = true, emails = [true, true] }: { saved?: boolean; emails?: boolean[] } = {}) {
  const sendEmail = vi.fn<(email: OutgoingEmail) => Promise<boolean>>();
  for (const result of emails) sendEmail.mockResolvedValueOnce(result);
  return {
    settings,
    createInquiry: saved ? vi.fn(async () => "id1") : vi.fn(async (): Promise<string> => { throw new Error("down"); }),
    markEmailFailed: vi.fn(async (id: string) => void id),
    sendEmail,
  };
}

describe("processInquiry", () => {
  it("saves, notifies the owner and auto-replies to the client", async () => {
    const d = deps();
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.sendEmail.mock.calls.map(([email]) => email.to).sort()).toEqual(["ada@example.com", "owner@x.y"]);
    expect(d.markEmailFailed).not.toHaveBeenCalled();
  });

  it("flags the saved inquiry when an email fails, and still succeeds", async () => {
    const d = deps({ emails: [false, true] });
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.markEmailFailed).toHaveBeenCalledWith("id1");
  });

  it("succeeds on the owner email alone when the database is down", async () => {
    const d = deps({ saved: false });
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.sendEmail.mock.calls[0][0].text).toContain("could not be saved");
  });

  it("fails only when both the save and the owner email fail", async () => {
    const d = deps({ saved: false, emails: [false, false] });
    expect(await processInquiry(values, d)).toBe(false);
  });
});
