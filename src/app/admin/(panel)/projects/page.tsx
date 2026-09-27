import { Plus } from "lucide-react";
import { ProjectList } from "@/app/admin/(panel)/projects/project-list";
import { ButtonLink } from "@/components/ui/button-link";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ProjectsAdminPage() {
  await requireAdmin();
  const projects = (await repos.projects.list()).map(({ id, title, slug, category, featured }) => ({ id, title, slug, category, featured }));

  return (
    <>
      <PageTitle
        action={
          <ButtonLink href="/admin/projects/new" variant="accent" size="sm" icon={<Plus />}>
            Add project
          </ButtonLink>
        }
      >
        Projects
      </PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Order here is the order on /work. Featured projects also appear on the home page.</p>
      <ProjectList projects={projects} />
    </>
  );
}
