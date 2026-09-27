import type { ReactNode } from "react";
import { FiverrIcon, GithubIcon, UpworkIcon } from "@/components/ui/brand-icons";
import { siteConfig, socialLabels } from "@/content/site";
import type { SiteConfig } from "@/types/site";

type SocialKey = keyof SiteConfig["social"];

const icons: Record<SocialKey, ReactNode> = {
  github: <GithubIcon />,
  fiverr: <FiverrIcon />,
  upwork: <UpworkIcon />,
};

export function SocialLinks({ className }: { className?: string }) {
  const socials = (Object.entries(siteConfig.social) as [SocialKey, string | undefined][]).filter(
    (entry): entry is [SocialKey, string] => Boolean(entry[1]),
  );
  if (socials.length === 0) return null;

  return (
    <ul className={className ?? "flex gap-2"}>
      {socials.map(([key, href]) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn bg-white"
            aria-label={`${socialLabels[key]} (opens in a new tab)`}
            data-cursor="Open ↗"
          >
            {icons[key]}
          </a>
        </li>
      ))}
    </ul>
  );
}
