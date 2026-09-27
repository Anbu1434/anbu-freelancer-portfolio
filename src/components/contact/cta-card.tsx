import { Mail, Send } from "lucide-react";
import { StartProjectButton } from "@/components/inquiry/start-project-button";
import { Availability } from "@/components/ui/availability";
import { ButtonLink } from "@/components/ui/button-link";
import { cardClass } from "@/components/ui/card";
import { getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/cn";

export async function CtaCard() {
  const siteConfig = await getSiteConfig();
  return (
    <section
      aria-labelledby="cta-title"
      className={cn(cardClass("ink"), "mt-14 grid gap-8 p-6 sm:p-8 lg:mt-16 lg:p-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end")}
      data-reveal
    >
      <div>
        <p className="meta">
          <Availability status={siteConfig.availability} long />
        </p>
        <h2 id="cta-title" className="title mt-4 text-[clamp(2rem,4.6vw,3.75rem)]">
          Have something worth building?
        </h2>
      </div>
      <div className="flex flex-wrap gap-3">
        <StartProjectButton variant="accent" icon={<Send />}>
          Start project
        </StartProjectButton>
        <ButtonLink href={`mailto:${siteConfig.email}`} variant="secondary" icon={<Mail />}>
          Email me
        </ButtonLink>
      </div>
    </section>
  );
}
