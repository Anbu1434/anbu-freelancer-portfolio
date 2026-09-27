"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Availability } from "@/components/ui/availability";
import { navigation, siteConfig } from "@/content/site";
import { initials } from "@/lib/cn";

/** Top row of the canvas: back button on inner pages, status and quick actions on the right. */
export function Topbar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const parent = segments.length > 0 ? `/${segments.slice(0, -1).join("/")}` : null;
  const parentLabel = navigation.find((item) => item.href === parent)?.label ?? "Home";

  return (
    <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">
      {parent !== null ? (
        <Link href={parent} className="icon-btn" aria-label={`Back to ${parentLabel}`}>
          <ArrowLeft aria-hidden="true" />
        </Link>
      ) : (
        <p className="meta font-semibold normal-case">~/{siteConfig.brand.toLowerCase()}</p>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        <p className="meta hidden h-11 items-center border-2 border-ink bg-white px-3 sm:flex">
          <Availability long />
        </p>
        <a href={`mailto:${siteConfig.email}`} className="icon-btn bg-accent" aria-label={`Email ${siteConfig.email}`}>
          <Mail aria-hidden="true" />
        </a>
        <Link href="/about" className="icon-btn bg-tint font-mono text-sm font-extrabold" aria-label="About me">
          {initials(siteConfig.name)}
        </Link>
      </div>
    </div>
  );
}
