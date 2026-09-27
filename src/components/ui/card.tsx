import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const tones = {
  paper: "bg-paper",
  white: "bg-white",
  accent: "bg-accent",
  tint: "bg-tint",
  frame: "bg-frame text-on-frame",
  ink: "bg-ink text-paper",
} as const;

export type CardTone = keyof typeof tones;

/** Bordered surface with the reference's hard offset shadow. */
export function cardClass(tone: CardTone = "white", shadow = true) {
  return cn("border-2 border-ink", tones[tone], shadow && "shadow-hard");
}

type CardProps = ComponentProps<"div"> & { tone?: CardTone; shadow?: boolean };

export function Card({ tone, shadow, className, ...props }: CardProps) {
  return <div className={cn(cardClass(tone, shadow), className)} {...props} />;
}
