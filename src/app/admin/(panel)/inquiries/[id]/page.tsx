import { notFound } from "next/navigation";
import { sendReply } from "@/app/admin/(panel)/inquiries/actions";
import { StatusSelect } from "@/app/admin/(panel)/inquiries/[id]/status-select";
import { EntityForm } from "@/components/admin/entity-form";
import { replySections } from "@/components/admin/field-configs";
import { Card, cardClass } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { formatDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import { getInquiry, setInquiryStatus } from "@/lib/db/inquiries";
import { findSettings } from "@/lib/db/settings";

type Props = { params: Promise<{ id: string }> };

export default async function InquiryPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  let inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  // Opening a new request marks it read.
  if (inquiry.status === "new") {
    await setInquiryStatus(id, "read");
    inquiry = { ...inquiry, status: "read" };
  }
  const settings = await findSettings();
  const whatsapp = inquiry.phone.replace(/\D/g, "");

  return (
    <>
      <PageTitle eyebrow={`Received ${formatDate(inquiry.createdAt)}`}>{inquiry.name}</PageTitle>

      {inquiry.emailFailed && (
        <p role="status" className={cn(cardClass("accent", false), "mt-6 p-4 font-bold")}>
          An email for this request failed to send (owner notification or client auto-reply). Check the Resend dashboard, and reply from here.
        </p>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-5 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="meta font-bold">Email</dt>
              <dd>
                <a href={`mailto:${inquiry.email}`} className="link-underline break-all">
                  {inquiry.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="meta font-bold">Phone / WhatsApp</dt>
              <dd className="flex flex-wrap gap-3">
                <a href={`tel:${inquiry.phone}`} className="link-underline">
                  {inquiry.phone}
                </a>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="link-underline">
                  WhatsApp ↗
                </a>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="meta font-bold">Services</dt>
              <dd>{inquiry.services.join(", ")}</dd>
            </div>
          </dl>
          <h2 className="meta mt-6 font-bold">Project details</h2>
          <p className="mt-2 whitespace-pre-wrap">{inquiry.businessDetails}</p>
        </Card>

        <Card tone="tint" className="self-start p-5">
          <h2 className="meta font-bold">Status</h2>
          <StatusSelect id={id} status={inquiry.status} />
        </Card>
      </div>

      <section aria-labelledby="replies-title" className="mt-10">
        <h2 id="replies-title" className="title text-2xl">
          Replies
        </h2>
        {inquiry.replies.map((reply, index) => (
          <article key={index} className={cn(cardClass("white"), "mt-4 p-5")}>
            <p className="meta">
              {formatDate(reply.sentAt)} · {reply.delivered ? "Sent" : "Not delivered"}
            </p>
            <p className="mt-2 font-bold">{reply.subject}</p>
            <p className="mt-2 whitespace-pre-wrap">{reply.body}</p>
          </article>
        ))}
        <Card className="mt-6 p-5 sm:p-6">
          <p className="meta mb-5 font-bold">New reply to {inquiry.email}</p>
          <EntityForm
            sections={replySections}
            initial={{ subject: `Re: your project request — ${settings?.brand ?? ""}`, body: "" }}
            action={sendReply.bind(null, id)}
            submitLabel="Send reply"
            resetOnSuccess
          />
        </Card>
      </section>
    </>
  );
}
