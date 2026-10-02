import { AppWindow, Bot, Cloud, Gauge, Layers, PanelsTopLeft, ShoppingBag, type LucideIcon } from "lucide-react";
import { cardClass } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { Service } from "@/types/content";

const icons: Record<string, LucideIcon> = {
  "01": AppWindow,
  "02": ShoppingBag,
  "03": PanelsTopLeft,
  "04": Bot,
  "05": Cloud,
  "06": Gauge,
};

type ServiceCardProps = {
  service: Service;
  detailed?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** The reference's review card, holding a service instead. */
export function ServiceCard({ service, detailed = false, headingLevel: Heading = "h3", className }: ServiceCardProps) {
  const Icon = icons[service.number] ?? Layers;

  return (
    <article className={cn(cardClass("white"), "flex flex-col p-5", detailed && "sm:p-6", className)} data-reveal>
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className="grid size-11 place-items-center border-2 border-ink bg-paper">
          <Icon className="size-5" />
        </span>
        <span className="meta font-bold">{service.number}</span>
      </div>
      <Heading className={cn("title mt-5 leading-tight", detailed ? "text-[clamp(1.375rem,2.4vw,1.875rem)]" : "text-lg")}>
        {service.title}
      </Heading>
      <p className={cn("mt-3 text-ink/80", detailed ? "text-base" : "text-sm")}>{service.description}</p>
      {detailed && (
        <ul className="mt-5 grid gap-2 border-t-2 border-ink pt-5 text-[0.9375rem] font-medium">
          {service.includes.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-2 size-2 shrink-0 bg-ink" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
