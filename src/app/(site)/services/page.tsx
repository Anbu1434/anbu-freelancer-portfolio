import type { Metadata } from "next";
import { CtaCard } from "@/components/contact/cta-card";
import { ServiceCard } from "@/components/services/service-card";
import { cardClass } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { getProcessSteps, getServices, getSiteConfig } from "@/lib/content";
import { cn } from "@/lib/cn";
import { createMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata(await getSiteConfig(), {
    title: "Services",
  description: "Websites, custom software, SaaS development, AI integration, and SEO & performance — from first idea to production.",
    path: "/services",
  });
}

export default async function ServicesPage() {
  const [services, workProcess] = await Promise.all([getServices(), getProcessSteps()]);
  return (
    <>
      <PageTitle>What I build</PageTitle>
      <p className="mt-4 max-w-[52ch] text-lead text-ink/80">Focused product work, from first idea to production.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10">
        {services.map((service) => (
          <ServiceCard key={service.number} service={service} detailed headingLevel="h2" />
        ))}
      </div>

      <section aria-labelledby="process-title" className="mt-14 lg:mt-16">
        <PageTitle as="h2" id="process-title">
          How I work
        </PageTitle>
        <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:mt-8 xl:grid-cols-4">
          {workProcess.map((step, index) => (
            <li key={step.number} className={cn(cardClass(index === 0 ? "tint" : "white"), "p-5")} data-reveal>
              <span className="meta font-bold">{step.number}</span>
              <h3 className="title mt-4 text-2xl">{step.title}</h3>
              <p className="mt-3 text-[0.9375rem] text-ink/80">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <CtaCard />
    </>
  );
}
