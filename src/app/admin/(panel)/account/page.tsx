import { PasswordForm } from "@/app/admin/(panel)/account/password-form";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AccountPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageTitle>Account</PageTitle>
      <p className="mt-4 text-ink/80">Signed in as {admin.email}.</p>
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="meta mb-5 font-bold">Change password</h2>
        <PasswordForm />
      </Card>
    </>
  );
}
