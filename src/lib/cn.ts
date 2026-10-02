export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    // Strip punctuation so bracketed placeholders still yield sensible letters.
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
