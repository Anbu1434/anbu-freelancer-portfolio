import { cn } from "@/lib/cn";
import { availabilityLabels } from "@/lib/site-constants";
import type { Availability as AvailabilityStatus } from "@/types/site";

export function Availability({ status, long = false, className }: { status: AvailabilityStatus; long?: boolean; className?: string }) {
  const labels = availabilityLabels[status];

  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      {long ? labels.long : labels.short}
      <span
        aria-hidden="true"
        className={cn("size-2.5 shrink-0 rounded-full border-2 border-current", status === "available" ? "bg-current" : "bg-transparent")}
      />
    </span>
  );
}
