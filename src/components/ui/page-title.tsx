import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageTitleProps = {
  children: ReactNode;
  as?: "h1" | "h2";
  id?: string;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageTitle({ children, as: Heading = "h1", id, eyebrow, action, className }: PageTitleProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="meta mb-3 font-semibold">{eyebrow}</p>}
        <Heading
          id={id}
          className={cn(
            "title",
            Heading === "h1" ? "text-[clamp(2.125rem,4.6vw,3.75rem)]" : "text-[clamp(1.5rem,2.6vw,2.5rem)]",
          )}
        >
          {children}
        </Heading>
      </div>
      {action}
    </div>
  );
}
