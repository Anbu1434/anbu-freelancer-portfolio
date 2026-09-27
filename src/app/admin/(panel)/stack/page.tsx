import { createStackGroup, deleteStackGroup, moveStackGroup, updateStackGroup } from "@/app/admin/(panel)/stack/actions";
import { emptyValues, stackSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function StackAdminPage() {
  await requireAdmin();
  const items = (await repos.stackGroups.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Tech stack</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">
        Groups on the About page. Names with a known brand logo (React, Next.js, MongoDB…) show the logo; others show a wordmark.
      </p>
      <OrderedListEditor
        items={items}
        sections={stackSections}
        empty={emptyValues(stackSections)}
        titleField="label"
        noun="group"
        create={createStackGroup}
        update={updateStackGroup}
        remove={deleteStackGroup}
        move={moveStackGroup}
      />
    </>
  );
}
