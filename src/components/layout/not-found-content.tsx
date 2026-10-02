import { House } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export function NotFoundContent() {
  return (
    <>
      <PageTitle eyebrow="(404)">Page not found</PageTitle>
      <Card tone="tint" className="mt-8 max-w-2xl p-6 sm:p-8">
        <p className="text-lead">This page doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/" icon={<House />}>
            Back home
          </ButtonLink>
          <ButtonLink href="/work" variant="secondary">
            View work
          </ButtonLink>
        </div>
      </Card>
    </>
  );
}
