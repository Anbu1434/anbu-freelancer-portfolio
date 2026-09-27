import { createService, deleteService, moveService, updateService } from "@/app/admin/(panel)/services/actions";
import { emptyValues, serviceSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ServicesAdminPage() {
  await requireAdmin();
  const items = (await repos.services.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Services</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Shown on the Services page and counted on the home page. Order here is the order on the site.</p>
      <OrderedListEditor
        items={items}
        sections={serviceSections}
        empty={emptyValues(serviceSections)}
        titleField="title"
        subtitleField="description"
        noun="service"
        create={createService}
        update={updateService}
        remove={deleteService}
        move={moveService}
      />
    </>
  );
}
