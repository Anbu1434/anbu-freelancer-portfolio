import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/content";
import { defaultTitle, siteUrl } from "@/lib/seo";
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

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();

  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: site.brand },
    description: site.description,
    applicationName: site.brand,
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    openGraph: {
      type: "website",
      siteName: site.brand,
      locale: "en_US",
      url: "/",
      title: defaultTitle(site),
      description: site.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1c1c1e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}
