import Link from "next/link";
import { cardClass } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate, statusLabels } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { listInquiries } from "@/lib/db/inquiries";
import { inquiryStatuses } from "@/lib/db/schemas";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function InquiriesPage({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = inquiryStatuses.find((value) => value === status);
  const inquiries = await listInquiries(active);
  const filters = [{ value: undefined, label: "All" }, ...inquiryStatuses.map((value) => ({ value, label: statusLabels[value] }))];

  return (
    <>
      <PageTitle>Project requests</PageTitle>
      <nav aria-label="Filter by status" className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const current = filter.value === active;
          return (
            <Link
              key={filter.label}
              href={filter.value ? `/admin/inquiries?status=${filter.value}` : "/admin/inquiries"}
              className={cn("btn btn-sm", current ? "btn-accent" : "btn-white")}
              aria-current={current ? "page" : undefined}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {inquiries.length === 0 ? (
        <p className="mt-8 text-ink/70">No requests here.</p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <Link
                href={`/admin/inquiries/${inquiry.id}`}
                className={cn(cardClass(inquiry.status === "new" ? "tint" : "white"), "card-lift flex flex-wrap items-center gap-x-4 gap-y-1 p-4")}
              >
                <span className="font-bold">{inquiry.name}</span>
                <span className="text-sm text-ink/70">{inquiry.services.join(", ")}</span>
                {inquiry.emailFailed && <span className="meta border-2 border-ink bg-accent px-1.5 font-bold">Email failed</span>}
                <span className="meta ml-auto">
                  {statusLabels[inquiry.status]} · {formatDate(inquiry.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
