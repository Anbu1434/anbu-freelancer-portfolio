import { availabilityLabels, siteConfig } from "@/content/site";
import { cn } from "@/lib/cn";

export function Availability({ long = false, className }: { long?: boolean; className?: string }) {
  const labels = availabilityLabels[siteConfig.availability];

  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      {long ? labels.long : labels.short}
      <span
        aria-hidden="true"
        className={cn(
          "size-2.5 shrink-0 rounded-full border-2 border-current",
          siteConfig.availability === "available" ? "bg-current" : "bg-transparent",
        )}
      />
    </span>
  );
}
