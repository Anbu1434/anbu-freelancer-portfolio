import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { Card } from "@/components/ui/card";
import { getAdmin } from "@/lib/auth/dal";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card tone="paper" className="w-full max-w-md p-6 sm:p-8">
        <p className="meta font-bold">Admin</p>
        <h1 className="title mt-2 text-4xl">Sign in</h1>
        <LoginForm />
      </Card>
    </main>
  );
}
