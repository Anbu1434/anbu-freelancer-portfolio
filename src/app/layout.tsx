import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { InquiryProvider } from "@/components/inquiry/inquiry-provider";
import { Footer } from "@/components/layout/footer";
import { SiteNav } from "@/components/layout/site-nav";
import { Topbar } from "@/components/layout/topbar";
import { ContextCursor } from "@/components/ui/context-cursor";
import { RevealObserver } from "@/components/ui/reveal-observer";
import { siteConfig } from "@/content/site";
import { defaultTitle } from "@/lib/seo";
import "./globals.css";

// Variable Bricolage: the opsz axis keeps body text calm and lets headings get characterful; wdth drives the condensed display cut.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});

const code = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { absolute: siteConfig.brand },
  description: siteConfig.description,
  applicationName: siteConfig.brand,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.brand,
    locale: "en_US",
    url: "/",
    title: defaultTitle,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#1c1c1e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${code.variable}`}>
      <body>
        <InquiryProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
            <SiteNav />
            <div id="page" className="px-2 pb-2 sm:px-4 sm:pb-4 lg:py-6 lg:pl-0 lg:pr-6">
              <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col border-2 border-ink bg-paper lg:min-h-[calc(100dvh-3rem)]">
                <Topbar />
                <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
          </div>
          <RevealObserver />
          <ContextCursor />
        </InquiryProvider>
      </body>
    </html>
  );
}
