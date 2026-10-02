import { notFound } from "next/navigation";
import { updateProject } from "@/app/admin/(panel)/projects/actions";
import { EntityForm } from "@/components/admin/entity-form";
import { projectSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { storedProjectImages } from "@/lib/content";
import { repos } from "@/lib/db/repos";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const project = await repos.projects.get(id);
  if (!project) notFound();

  return (
    <>
      <PageTitle eyebrow="Edit project">{project.title}</PageTitle>
      <Card className="mt-8 p-5 sm:p-6">
        <EntityForm sections={projectSections} initial={{ ...project, images: storedProjectImages(project) }} action={updateProject.bind(null, id)} submitLabel="Save project" />
      </Card>
    </>
  );
}
