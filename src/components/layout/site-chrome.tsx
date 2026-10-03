import type { ReactNode } from "react";
import { InquiryProvider } from "@/components/inquiry/inquiry-provider";
import { Footer } from "@/components/layout/footer";
import { SiteNav } from "@/components/layout/site-nav";
import { Topbar } from "@/components/layout/topbar";
import { ContextCursor } from "@/components/ui/context-cursor";
import { RevealObserver } from "@/components/ui/reveal-observer";
import { ServicePop } from "@/components/ui/service-pop";
import { getSettings } from "@/lib/content";
import type { NavSite } from "@/types/site";

/** Public site frame: sidebar, canvas, top bar, footer and the inquiry modal. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const site: NavSite = {
    brand: settings.brand,
    name: settings.name,
    email: settings.email,
    resumeUrl: settings.resumeUrl,
    availability: settings.availability,
  };

  return (
    <InquiryProvider services={settings.inquiryServices} contactEmail={settings.email}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SiteNav site={site} />
        <div id="page" className="px-2 pb-2 sm:px-4 sm:pb-4 lg:py-6 lg:pl-0 lg:pr-6">
          <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col border-2 border-ink bg-paper lg:min-h-[calc(100dvh-3rem)]">
            <Topbar site={site} />
            <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
      <RevealObserver />
      <ContextCursor />
      <ServicePop services={settings.inquiryServices} />
    </InquiryProvider>
  );
}
