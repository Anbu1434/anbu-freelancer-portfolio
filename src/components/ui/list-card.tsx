import Link from "next/link";
import type { ReactNode } from "react";
import { cardClass } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type ListCardItem = {
  key: string;
  icon: ReactNode;
  title: ReactNode;
  lines?: ReactNode[];
  href?: string;
  /** Opens `href` in a new tab. */
  external?: boolean;
};

/** Stacked rows sharing one bordered, shadowed block — the reference's "work experience" list. */
export function ListCard({ items, className }: { items: ListCardItem[]; className?: string }) {
  return (
    <ul className={cn(cardClass("white"), className)} data-reveal>
      {items.map((item) => {
        const body = (
          <>
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center border-2 border-ink bg-paper [&_svg]:size-5">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-snug">{item.title}</span>
              {item.lines?.map((line, index) => (
                <span key={index} className="mt-0.5 block text-sm text-ink/75">
                  {line}
                </span>
              ))}
            </span>
            {item.href && (
              <span aria-hidden="true" className="arrow self-center text-lg">
                →
              </span>
            )}
          </>
        );

        return (
          <li key={item.key} className="border-b-2 border-ink last:border-b-0">
            {item.href ? (
              <Link
                href={item.href}
                {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
                className="group flex gap-4 p-4 transition-colors duration-200 hover:bg-accent-soft focus-visible:-outline-offset-[6px]"
              >
                {body}
              </Link>
            ) : (
              <div className="flex gap-4 p-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
