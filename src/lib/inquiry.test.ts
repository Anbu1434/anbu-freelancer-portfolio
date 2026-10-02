import { describe, expect, it } from "vitest";
import { normalizeInquiry, validateInquiry } from "@/lib/inquiry";

const services = ["Website Development", "SEO"];
const valid = { name: "Ada", email: "ada@example.com", phone: "+91 98765 43210", services: ["SEO"], businessDetails: "A new shop site." };

describe("validateInquiry", () => {
  it("accepts a complete request", () => {
    expect(validateInquiry(valid, services)).toEqual({});
  });

  it("rejects a service that is not currently offered", () => {
    expect(validateInquiry({ ...valid, services: ["Mobile App"] }, services).services).toBeDefined();
  });

  it("requires a valid email", () => {
    expect(validateInquiry({ ...valid, email: "" }, services).email).toBeDefined();
    expect(validateInquiry({ ...valid, email: "not-an-email" }, services).email).toBeDefined();
  });
});

describe("normalizeInquiry", () => {
  it("trims and lowercases the email", () => {
    expect(normalizeInquiry({ ...valid, email: "  Ada@Example.COM " }).email).toBe("ada@example.com");
  });
});
