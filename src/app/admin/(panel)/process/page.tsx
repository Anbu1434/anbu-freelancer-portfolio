import { createProcessStep, deleteProcessStep, moveProcessStep, updateProcessStep } from "@/app/admin/(panel)/process/actions";
import { emptyValues, processSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ProcessAdminPage() {
  await requireAdmin();
  const items = (await repos.processSteps.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>How I work</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">The process steps on the Services page.</p>
      <OrderedListEditor
        items={items}
        sections={processSections}
        empty={emptyValues(processSections)}
        titleField="title"
        subtitleField="description"
        noun="step"
        create={createProcessStep}
        update={updateProcessStep}
        remove={deleteProcessStep}
        move={moveProcessStep}
      />
    </>
  );
}
