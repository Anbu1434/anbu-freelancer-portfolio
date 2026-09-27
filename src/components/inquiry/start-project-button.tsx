"use client";

import type { ReactNode } from "react";
import { useStartProject } from "@/components/inquiry/inquiry-provider";
import { cn } from "@/lib/cn";

type StartProjectButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "white";
  size?: "md" | "sm";
  icon?: ReactNode;
  className?: string;
  /** Runs before the modal opens, e.g. to close the mobile menu. */
  onClick?: () => void;
};

/** Same look as ButtonLink, but opens the project inquiry modal. */
export function StartProjectButton({ children = "Start project", variant = "primary", size = "md", icon, className, onClick }: StartProjectButtonProps) {
  const start = useStartProject();

  function handleClick() {
    onClick?.();
    start();
  }

  return (
    <button type="button" onClick={handleClick} aria-haspopup="dialog" className={cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}>
      {icon && (
        <span aria-hidden="true" className="contents">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
