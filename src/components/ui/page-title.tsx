import { Fragment, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Wraps each word so page headings can stamp in one word at a time (see `.stamp-word`). */
function stampWords(text: string) {
  const words = text.split(" ");
  return words.map((word, index) => (
    <Fragment key={index}>
      <span className="stamp-word" style={{ "--w": index } as CSSProperties}>
        {word}
      </span>
      {index < words.length - 1 && " "}
    </Fragment>
  ));
}

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
            Heading === "h1" ? "text-[clamp(2.125rem,4.6vw,3.75rem)]" : "title-bar text-[clamp(1.5rem,2.6vw,2.5rem)]",
          )}
        >
          {/* Page headings stamp in on load; section headings slide in on scroll instead. */}
          {Heading === "h1" && typeof children === "string" ? stampWords(children) : children}
        </Heading>
      </div>
      {action}
    </div>
  );
}
