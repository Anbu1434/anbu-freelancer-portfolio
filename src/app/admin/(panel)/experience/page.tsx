import { createExperience, deleteExperience, moveExperience, updateExperience } from "@/app/admin/(panel)/experience/actions";
import { emptyValues, experienceSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ExperienceAdminPage() {
  await requireAdmin();
  const items = (await repos.experience.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Experience</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Most recent first. Delete every entry and the About page hides the section.</p>
      <OrderedListEditor
        items={items}
        sections={experienceSections}
        empty={emptyValues(experienceSections)}
        titleField="role"
        subtitleField="company"
        noun="role"
        create={createExperience}
        update={updateExperience}
        remove={deleteExperience}
        move={moveExperience}
      />
    </>
  );
}
