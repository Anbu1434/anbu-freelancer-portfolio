import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "white";
  size?: "md" | "sm";
  /** Leading icon, as in the reference's buttons. */
  icon?: ReactNode;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", size = "md", icon, className }: ButtonLinkProps) {
  const classes = cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className);
  const content = (
    <>
      {icon && <span aria-hidden="true" className="contents">{icon}</span>}
      {children}
    </>
  );

  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} data-cursor="Open ↗">
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
