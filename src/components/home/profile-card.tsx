import { BriefcaseBusiness, Send } from "lucide-react";
import Image from "next/image";
import { StartProjectButton } from "@/components/inquiry/start-project-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { SocialLinks } from "@/components/ui/social-links";
import { getProjects, getServices, getSettings, getStack, toSiteConfig } from "@/lib/content";
import { cn, initials, pad } from "@/lib/cn";
import { availabilityLabels } from "@/lib/site-constants";
import type { SiteConfig } from "@/types/site";

/** The accent profile card — the page's focal point. Tiles show counts derived from real content — never invented metrics. */
export async function ProfileCard({ className }: { className?: string }) {
  const [settings, projects, services, stack] = await Promise.all([getSettings(), getProjects(), getServices(), getStack()]);
  const siteConfig = toSiteConfig(settings);
  const about = settings.about;
  const tiles = [
    { value: pad(projects.length), label: "Projects", count: true },
    { value: pad(services.length), label: "Services", count: true },
    { value: pad(stack.reduce((total, group) => total + group.items.length, 0)), label: "Technologies", count: true },
    { value: siteConfig.year, label: availabilityLabels[siteConfig.availability].short, count: false },
  ];

  return (
    <Card
      tone="accent"
      className={cn("grid gap-5 p-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-6", className)}
      data-reveal
    >
      <Portrait siteConfig={siteConfig} />

      <div className="flex min-w-0 flex-col">
        {/* Phones: socials get their own row under the name; wider: they sit top-right. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight">{siteConfig.name}</h2>
            <a href={`mailto:${siteConfig.email}`} className="mt-1 inline-block break-all text-sm hover:underline">
              {siteConfig.email}
            </a>
          </div>
          <SocialLinks labelledOnPhones />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="tile flex flex-col-reverse">
              <dt className="text-xs font-medium">{tile.label}</dt>
              <dd className="text-xl font-bold leading-tight">{tile.count ? <CountUp value={tile.value} /> : tile.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-[0.9375rem] leading-relaxed">{about.intro[0]}</p>

        {/* Wraps instead of squeezing, so labels never overflow their buttons. */}
        <div className="mt-6 flex flex-wrap gap-3 lg:mt-auto lg:pt-6 [&>*]:grow">
          <StartProjectButton icon={<Send />}>Start project</StartProjectButton>
          <ButtonLink href="/work" variant="secondary" icon={<BriefcaseBusiness />}>
            View work
          </ButtonLink>
        </div>
        {siteConfig.resumeUrl && (
          <a href={siteConfig.resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-4 self-start text-sm font-bold underline underline-offset-4">
            View resume ↗<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </Card>
  );
}

function Portrait({ siteConfig }: { siteConfig: SiteConfig }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-ink bg-tint sm:aspect-[4/5]">
      {siteConfig.portrait ? (
        <Image
          src={siteConfig.portrait}
          alt={siteConfig.portraitAlt ?? `Portrait of ${siteConfig.name}`}
          fill
          sizes="(min-width: 1024px) 13rem, (min-width: 640px) 11rem, 100vw"
          // The portrait is the home page's LCP element.
          preload
          className="object-cover"
        />
      ) : (
        <div aria-hidden="true" className="grid h-full place-items-center">
          <span className="absolute left-1/2 top-1/2 aspect-square w-[62%] max-w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-accent-soft" />
          <span className="title relative text-[clamp(2.75rem,5vw,4rem)]">{initials(siteConfig.name)}</span>
        </div>
      )}
    </div>
  );
}
