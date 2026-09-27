import { EntityForm } from "@/components/admin/entity-form";
import { settingsSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { saveSettingsAction } from "@/app/admin/(panel)/settings/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { findSettings } from "@/lib/db/settings";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await findSettings();

  return (
    <>
      <PageTitle>Settings</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Profile, contact details and site-wide text. Changes appear on the live site right after saving.</p>
      <Card className="mt-8 p-5 sm:p-6">
        {settings ? (
          <EntityForm sections={settingsSections} initial={settings} action={saveSettingsAction} submitLabel="Save settings" />
        ) : (
          <p>
            No settings found. Run <code className="font-mono">npm run db:seed</code> first.
          </p>
        )}
      </Card>
    </>
  );
}
