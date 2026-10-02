import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/dal";
import { countInquiries } from "@/lib/db/inquiries";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const newInquiries = await countInquiries("new");

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
      <AdminNav email={admin.email} newInquiries={newInquiries} />
      <div className="px-2 pb-2 sm:px-4 sm:pb-4 lg:py-6 lg:pl-0 lg:pr-6">
        <main className="min-h-[calc(100dvh-3rem)] border-2 border-ink bg-paper px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
      </div>
    </div>
  );
}
