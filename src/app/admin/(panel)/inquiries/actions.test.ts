import { describe, expect, it, vi } from "vitest";
import { sendReply } from "@/app/admin/(panel)/inquiries/actions";
import { createInquiry, getInquiry } from "@/lib/db/inquiries";
import { sendEmail } from "@/lib/mail";
import { setupTestDb } from "@/test/mongo";

vi.mock("@/lib/auth/dal", () => ({ requireAdmin: vi.fn(async () => ({ id: "a1", email: "me@example.com" })) }));
vi.mock("@/lib/mail", () => ({ sendEmail: vi.fn(async () => true) }));

setupTestDb();

const values = { name: "Ada", email: "ada@example.com", phone: "123 4567", services: ["SEO"], businessDetails: "Details here." };

describe("sendReply", () => {
  it("emails the client, records the reply and marks the request replied", async () => {
    const id = await createInquiry(values);
    expect(await sendReply(id, { subject: "Hello", body: "Thanks for writing." })).toEqual({ ok: true });
    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(expect.objectContaining({ to: "ada@example.com", subject: "Hello" }));
    const inquiry = await getInquiry(id);
    expect(inquiry?.status).toBe("replied");
    expect(inquiry?.replies).toMatchObject([{ subject: "Hello", delivered: true }]);
  });

  it("rejects an empty message without sending", async () => {
    const id = await createInquiry(values);
    vi.mocked(sendEmail).mockClear();
    expect(await sendReply(id, { subject: "Hello", body: "" })).toMatchObject({ ok: false, fieldErrors: { body: expect.any(String) } });
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });
});
