import { afterEach, describe, expect, it, vi } from "vitest";
import { inquiryAutoReply, inquiryNotification, sendEmail } from "@/lib/mail";

const values = { name: "Ada\r\nBcc: x@y.z", email: "ada@example.com", phone: "123 4567", services: ["SEO"], businessDetails: "Details here." };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendEmail", () => {
  it("posts to Resend with reply_to and a single-line subject", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmail({ to: "a@b.c", subject: "Hi\nthere", text: "Body", replyTo: "me@x.y" })).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ to: ["a@b.c"], subject: "Hi there", text: "Body", reply_to: "me@x.y" });
  });

  it("returns false when Resend rejects", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 422 })));
    expect(await sendEmail({ to: "a@b.c", subject: "s", text: "t" })).toBe(false);
  });
});

describe("templates", () => {
  it("notification links to the admin inbox and replies to the client", () => {
    const email = inquiryNotification(values, "abc123", "owner@x.y");
    expect(email.text).toContain("/admin/inquiries/abc123");
    expect(email.replyTo).toBe("ada@example.com");
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it("auto-reply goes to the client with the configured message", () => {
    const email = inquiryAutoReply(values, { brand: "AnbuDev", name: "Anbu", email: "owner@x.y", autoReplyMessage: "Thanks!" });
    expect(email.to).toBe("ada@example.com");
    expect(email.replyTo).toBe("owner@x.y");
    expect(email.text).toContain("Thanks!");
  });

  it("auto-reply never echoes free text the visitor typed (no spam relay)", () => {
    const spam = { ...values, name: "Win a prize at evil.example", businessDetails: "Click http://evil.example now" };
    const email = inquiryAutoReply(spam, { brand: "AnbuDev", name: "Anbu", email: "owner@x.y", autoReplyMessage: "Thanks!" });
    expect(email.text).not.toContain("evil.example");
    expect(email.subject).not.toContain("evil.example");
    expect(email.text).toContain("SEO");
  });
});
