import type { Testimonial } from "@/types/content";

// TODO(content): replace with real client feedback you have permission to publish.
// Never invent a quote, a name or a rating. Empty this array and the reviews section disappears.
// Optional per entry: avatar: "/clients/jane.jpg" (file in public/clients/) and rating: 4.8.
// Without an avatar the card shows the client's initials.
export const testimonials: Testimonial[] = [
  {
    quote: "[Paste a real client quote here — what you built for them and how the work went.]",
    name: "[Client name]",
    role: "[Their role]",
    company: "[Company]",
  },
  {
    quote: "[A second quote. Two or three sentences reads best in this card.]",
    name: "[Client name]",
    role: "[Their role]",
    company: "[Company]",
  },
  {
    quote: "[A third quote. Delete any you don't need — the layout adapts.]",
    name: "[Client name]",
    role: "[Their role]",
    company: "[Company]",
  },
];
