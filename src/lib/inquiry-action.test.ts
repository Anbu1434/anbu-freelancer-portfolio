import { afterEach, describe, expect, it, vi } from "vitest";
import { submitInquiry } from "@/lib/inquiry-action";
import { sendEmail } from "@/lib/mail";

vi.mock("@/lib/request", () => ({ clientIp: vi.fn(async () => "198.51.100.1") }));
vi.mock("@/lib/content", () => ({ getSettings: vi.fn(async () => { throw new Error("mongo down"); }) }));
vi.mock("@/lib/db/inquiries", () => ({
  createInquiry: vi.fn(async () => { throw new Error("mongo down"); }),
  markEmailFailed: vi.fn(async () => {}),
}));
vi.mock("@/lib/mail", async (original) => ({ ...(await original<typeof import("@/lib/mail")>()), sendEmail: vi.fn(async () => true) }));

afterEach(() => vi.unstubAllEnvs());

const submission = {
  name: "Ada",
  email: "ada@example.com",
  phone: "+91 98765 43210",
  services: ["SEO"],
  businessDetails: "A new shop website.",
  startedAt: Date.now() - 60_000,
};

describe("submitInquiry when MongoDB is down and settings are not cached", () => {
  it("still emails the owner and reports success", async () => {
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    expect(await submitInquiry(submission)).toEqual({ status: "success" });
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.com" }));
  });
});
