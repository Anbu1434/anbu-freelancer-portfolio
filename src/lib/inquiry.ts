/** Project inquiry: fields and validation shared by the modal and the server action. Service options come from settings. */

export const inquiryFields = ["name", "email", "phone", "services", "businessDetails"] as const;

export type InquiryField = (typeof inquiryFields)[number];
export type InquiryValues = {
  name: string;
  email: string;
  phone: string;
  services: string[];
  businessDetails: string;
};
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export const emptyInquiry: InquiryValues = { name: "", email: "", phone: "", services: [], businessDetails: "" };

const phonePattern = /^\+?[\d\s\-().]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiryField(field: InquiryField, values: InquiryValues, services: readonly string[]): string | undefined {
  switch (field) {
    case "name": {
      const name = values.name.trim();
      if (!name) return "Please tell us your name.";
      if (name.length > 100) return "Please keep your name under 100 characters.";
      return undefined;
    }
    case "email": {
      const email = values.email.trim();
      if (!email) return "Please add your email so we can reply.";
      if (email.length > 200 || !emailPattern.test(email)) return "Please enter a valid email address.";
      return undefined;
    }
    case "phone": {
      const phone = values.phone.trim();
      const digits = phone.replace(/\D/g, "").length;
      if (!phone) return "Please add a phone or WhatsApp number.";
      if (!phonePattern.test(phone) || digits < 7 || digits > 15) return "Please enter a valid phone number.";
      return undefined;
    }
    case "services":
      if (values.services.length === 0) return "Pick at least one service.";
      if (values.services.some((service) => !services.includes(service))) return "Please pick from the listed services.";
      return undefined;
    case "businessDetails": {
      const details = values.businessDetails.trim();
      if (!details) return "Please tell us a little about your project.";
      if (details.length < 10) return "Please add a little more detail.";
      if (details.length > 5000) return "Please keep this under 5,000 characters.";
      return undefined;
    }
  }
}

export function validateInquiry(values: InquiryValues, services: readonly string[]): InquiryErrors {
  const errors: InquiryErrors = {};
  for (const field of inquiryFields) {
    const error = validateInquiryField(field, values, services);
    if (error) errors[field] = error;
  }
  return errors;
}

/** Coerces untrusted input (e.g. the server action's argument) into trimmed inquiry values. */
export function normalizeInquiry(input: Partial<Record<keyof InquiryValues, unknown>>): InquiryValues {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const services = Array.isArray(input.services) ? input.services.filter((item): item is string => typeof item === "string") : [];

  return {
    name: text(input.name),
    email: text(input.email).toLowerCase(),
    phone: text(input.phone),
    services: [...new Set(services)],
    businessDetails: text(input.businessDetails),
  };
}
