import { createProject } from "@/app/admin/(panel)/projects/actions";
import { EntityForm } from "@/components/admin/entity-form";
import { emptyValues, projectSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle eyebrow="Projects">New project</PageTitle>
      <Card className="mt-8 p-5 sm:p-6">
        <EntityForm sections={projectSections} initial={emptyValues(projectSections)} action={createProject} submitLabel="Create project" redirectOnCreate="/admin/projects/" />
      </Card>
    </>
  );
}
