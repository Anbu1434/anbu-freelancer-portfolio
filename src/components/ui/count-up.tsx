import type { CSSProperties } from "react";

/**
 * A zero-padded number (as produced by `pad`) that counts up from 00 on load — pure CSS, see `.count-up`.
 * The real value is rendered as text, so it is correct without JS, for screen readers and with reduced motion.
 */
export function CountUp({ value }: { value: string }) {
  if (!/^\d+$/.test(value)) return value;
  return (
    <span className="count-up" style={{ "--to": Number(value) } as CSSProperties}>
      {value}
    </span>
  );
}
