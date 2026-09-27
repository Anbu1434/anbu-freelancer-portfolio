import Link from "next/link";
import { Card, cardClass } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { countInquiries, listInquiries } from "@/lib/db/inquiries";
import { repos } from "@/lib/db/repos";

export default async function DashboardPage() {
  await requireAdmin();
  const [newCount, projects, services, testimonials, latest] = await Promise.all([
    countInquiries("new"),
    repos.projects.count(),
    repos.services.count(),
    repos.testimonials.count(),
    listInquiries("new"),
  ]);

  const tiles = [
    { label: "New inquiries", value: newCount, href: "/admin/inquiries" },
    { label: "Projects", value: projects, href: "/admin/projects" },
    { label: "Services", value: services, href: "/admin/services" },
    { label: "Testimonials", value: testimonials, href: "/admin/testimonials" },
  ];

  return (
    <>
      <PageTitle>Dashboard</PageTitle>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className={cn(cardClass(tile.label === "New inquiries" ? "accent" : "white"), "card-lift p-5")}>
            <p className="title text-4xl">{tile.value}</p>
            <p className="meta mt-2 font-bold">{tile.label}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="meta font-bold">Latest unread requests</h2>
        {latest.length === 0 ? (
          <p className="mt-4 text-ink/70">No unread requests.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {latest.slice(0, 5).map((inquiry) => (
              <li key={inquiry.id}>
                <Link href={`/admin/inquiries/${inquiry.id}`} className="flex flex-wrap justify-between gap-2 border-2 border-ink bg-paper p-3 hover:bg-tint">
                  <span className="font-bold">{inquiry.name}</span>
                  <span className="meta">{new Date(inquiry.createdAt).toLocaleString("en-IN")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
