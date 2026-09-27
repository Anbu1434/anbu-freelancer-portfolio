import { describe, expect, it } from "vitest";
import { addReply, countInquiries, createInquiry, getInquiry, listInquiries, markEmailFailed, setInquiryStatus } from "@/lib/db/inquiries";
import { useTestDb } from "@/test/mongo";

useTestDb();

const values = { name: "Ada", email: "ada@example.com", phone: "+91 98765 43210", services: ["SEO"], businessDetails: "A new shop site." };

describe("inquiries repository", () => {
  it("stores a new inquiry with status new", async () => {
    const id = await createInquiry(values);
    const inquiry = await getInquiry(id);
    expect(inquiry).toMatchObject({ ...values, status: "new", emailFailed: false, replies: [] });
    expect(await countInquiries("new")).toBe(1);
  });

  it("lists newest first and filters by status", async () => {
    const first = await createInquiry(values);
    await createInquiry({ ...values, name: "Bob" });
    await setInquiryStatus(first, "archived");
    expect((await listInquiries()).map((item) => item.name)).toEqual(["Bob", "Ada"]);
    expect((await listInquiries("archived")).map((item) => item.name)).toEqual(["Ada"]);
  });

  it("records replies and marks as replied only when delivered", async () => {
    const id = await createInquiry(values);
    await addReply(id, { subject: "Hi", body: "Thanks", delivered: false });
    expect((await getInquiry(id))?.status).toBe("new");
    await addReply(id, { subject: "Hi", body: "Thanks", delivered: true });
    const inquiry = await getInquiry(id);
    expect(inquiry?.status).toBe("replied");
    expect(inquiry?.replies).toHaveLength(2);
  });

  it("flags email failures", async () => {
    const id = await createInquiry(values);
    await markEmailFailed(id);
    expect((await getInquiry(id))?.emailFailed).toBe(true);
  });
});
