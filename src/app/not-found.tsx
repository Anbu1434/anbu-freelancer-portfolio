import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteChrome } from "@/components/layout/site-chrome";

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
