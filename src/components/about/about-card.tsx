import { Crosshair, MapPin, Send } from "lucide-react";
import Image from "next/image";
import { StartProjectButton } from "@/components/inquiry/start-project-button";
import { Availability } from "@/components/ui/availability";
import { Card } from "@/components/ui/card";
import { SocialLinks } from "@/components/ui/social-links";
import { getSettings, toSiteConfig } from "@/lib/content";
import { cn, initials } from "@/lib/cn";
import type { SiteConfig } from "@/types/site";

/** The About page's compact "dossier": who, one statement, where — distinct from the home profile card. */
export async function AboutCard({ className }: { className?: string }) {
  const settings = await getSettings();
  const siteConfig = toSiteConfig(settings);
  const about = settings.about;
  const facts = [
    { icon: <MapPin />, label: "Based", value: siteConfig.location },
    { icon: <Crosshair />, label: "Focus", value: siteConfig.focus },
  ];

  return (
    <Card tone="white" className={cn("flex flex-col", className)} data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b-2 border-ink bg-tint px-5 py-2.5">
        <p className="meta font-semibold">~/about.md</p>
        <p className="meta">
          <Availability status={siteConfig.availability} long />
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar siteConfig={siteConfig} />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{siteConfig.name}</h2>
            <p className="meta mt-0.5 text-ink/75">{siteConfig.title}</p>
          </div>
          {/* Own row on phones so the name isn't squeezed. */}
          <SocialLinks className="flex w-full gap-2 sm:w-auto" />
        </div>

        <p className="title mt-5 text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.12]">
          <span aria-hidden="true" className="mr-1.5 text-accent">
            “
          </span>
          {about.intro[0]}
        </p>

        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t-2 border-ink pt-4">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-center gap-2 text-sm">
              <span aria-hidden="true" className="[&_svg]:size-4">
                {fact.icon}
              </span>
              <dt className="sr-only">{fact.label}</dt>
              <dd className="font-bold">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 lg:mt-auto lg:pt-5">
          <StartProjectButton icon={<Send />} className="w-full sm:w-auto">
            Start project
          </StartProjectButton>
        </div>
      </div>
    </Card>
  );
}

function Avatar({ siteConfig }: { siteConfig: SiteConfig }) {
  return (
    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden border-2 border-ink bg-accent shadow-hard-sm">
      {siteConfig.portrait ? (
        <Image src={siteConfig.portrait} alt={siteConfig.portraitAlt ?? `Portrait of ${siteConfig.name}`} fill sizes="3rem" className="object-cover" />
      ) : (
        <span aria-hidden="true" className="title text-lg">
          {initials(siteConfig.name)}
        </span>
      )}
    </span>
  );
}
