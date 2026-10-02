import type { ReactNode } from "react";
import { FiverrIcon, GithubIcon, UpworkIcon } from "@/components/ui/brand-icons";
import { getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/cn";
import { socialLabels } from "@/lib/site-constants";
import type { SiteConfig } from "@/types/site";

type SocialKey = keyof SiteConfig["social"];

const icons: Record<SocialKey, ReactNode> = {
  github: <GithubIcon />,
  fiverr: <FiverrIcon />,
  upwork: <UpworkIcon />,
};

type Props = {
  className?: string;
  /** Below 640px, render equal-width buttons with the network's name instead of bare icon squares. */
  labelledOnPhones?: boolean;
};

export async function SocialLinks({ className, labelledOnPhones = false }: Props) {
  const siteConfig = await getSiteConfig();
  const socials = (Object.entries(siteConfig.social) as [SocialKey, string | undefined][]).filter(
    (entry): entry is [SocialKey, string] => Boolean(entry[1]),
  );
  if (socials.length === 0) return null;

  return (
    <ul className={className ?? cn("flex gap-2", labelledOnPhones && "max-sm:grid max-sm:auto-cols-fr max-sm:grid-flow-col")}>
      {socials.map(([key, href]) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("icon-btn bg-white", labelledOnPhones && "max-sm:flex max-sm:w-full max-sm:justify-center max-sm:gap-2")}
            aria-label={`${socialLabels[key]} (opens in a new tab)`}
            data-cursor="Open ↗"
          >
            {icons[key]}
            {labelledOnPhones && (
              <span aria-hidden="true" className="text-sm font-bold sm:hidden">
                {socialLabels[key]}
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
