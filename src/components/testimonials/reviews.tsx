import { Star } from "lucide-react";
import Image from "next/image";
import { cardClass } from "@/components/ui/card";
import { ReviewCarousel } from "@/components/testimonials/review-carousel";
import { getTestimonials } from "@/lib/content";
import { cn, initials } from "@/lib/cn";
import type { Testimonial } from "@/types/content";

export async function Reviews() {
  const testimonials = await getTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="mt-14 lg:mt-16">
      <ReviewCarousel title="Client reviews" titleId="reviews-title">
        {testimonials.map((testimonial) => (
          <ReviewCard key={`${testimonial.name}-${testimonial.quote.slice(0, 24)}`} testimonial={testimonial} />
        ))}
      </ReviewCarousel>
    </section>
  );
}

function ReviewCard({ testimonial }: { testimonial: Testimonial }) {
  const subtitle = [testimonial.role, testimonial.company].filter(Boolean).join(", ");

  return (
    <figure className={cn(cardClass("white"), "flex flex-col p-5")} data-reveal>
      <figcaption className="flex items-start gap-3">
        <Avatar testimonial={testimonial} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold leading-tight">{testimonial.name}</p>
            {typeof testimonial.rating === "number" && (
              <p className="meta flex shrink-0 items-center gap-1 font-bold">
                <Star aria-hidden="true" className="size-4 fill-ink" />
                {testimonial.rating.toFixed(1)}
              </p>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-ink/70">{subtitle}</p>}
        </div>
      </figcaption>
      <blockquote className="mt-4 border-t-2 border-ink pt-4 text-[0.9375rem] leading-relaxed">
        {testimonial.quote}
      </blockquote>
    </figure>
  );
}

/** The name sits right beside it, so the photo is decorative and carries an empty alt. */
function Avatar({ testimonial }: { testimonial: Testimonial }) {
  if (testimonial.avatar) {
    return (
      <span className="relative block size-11 shrink-0 overflow-hidden border-2 border-ink bg-accent-soft">
        <Image src={testimonial.avatar} alt="" fill sizes="44px" className="object-cover" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center border-2 border-ink bg-accent-soft font-mono text-sm font-extrabold"
    >
      {initials(testimonial.name)}
    </span>
  );
}
