import { ButtonLink } from "@/components/ui/button-link";
import { PageTitle } from "@/components/ui/page-title";

export default function AdminNotFound() {
  return (
    <>
      <PageTitle eyebrow="(404)">Not found</PageTitle>
      <p className="mt-4 text-ink/80">It may have been deleted.</p>
      <ButtonLink href="/admin" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </>
  );
}
