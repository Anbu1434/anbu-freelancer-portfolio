import { createTestimonial, deleteTestimonial, moveTestimonial, updateTestimonial } from "@/app/admin/(panel)/testimonials/actions";
import { emptyValues, testimonialSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function TestimonialsAdminPage() {
  await requireAdmin();
  const items = (await repos.testimonials.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Testimonials</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">
        Only publish real feedback you have permission to use. Unpublished reviews stay here but are hidden on the site; with none published the reviews section disappears.
      </p>
      <OrderedListEditor
        items={items}
        sections={testimonialSections}
        empty={{ ...emptyValues(testimonialSections), published: true }}
        titleField="name"
        subtitleField="company"
        noun="testimonial"
        create={createTestimonial}
        update={updateTestimonial}
        remove={deleteTestimonial}
        move={moveTestimonial}
      />
    </>
  );
}
