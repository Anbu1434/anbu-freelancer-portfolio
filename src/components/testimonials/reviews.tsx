import { Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { StartProjectButton } from "@/components/inquiry/start-project-button";
import { cardClass } from "@/components/ui/card";
import { ReviewCarousel } from "@/components/testimonials/review-carousel";
import { testimonials } from "@/content/testimonials";
import { cn, initials, pad } from "@/lib/cn";
import type { Testimonial } from "@/types/content";

/** Average is shown only when every quote carries a real rating — never a partial or invented score. */
function averageRating(items: Testimonial[]) {
  const rated = items.filter((item) => typeof item.rating === "number");
  if (rated.length === 0 || rated.length !== items.length) return null;
  return (rated.reduce((total, item) => total + (item.rating ?? 0), 0) / rated.length).toFixed(1);
}

export function Reviews() {
  if (testimonials.length === 0) return null;
  const average = averageRating(testimonials);

  return (
    <section aria-labelledby="reviews-title" className="mt-14 lg:mt-16">
      <ReviewCarousel
        title="Client reviews"
        titleId="reviews-title"
        lead={<FeedbackPanel average={average} />}
      >
        {testimonials.map((testimonial) => (
          <ReviewCard key={`${testimonial.name}-${testimonial.quote.slice(0, 24)}`} testimonial={testimonial} />
        ))}
      </ReviewCarousel>
    </section>
  );
}

function FeedbackPanel({ average }: { average: string | null }) {
  return (
    <div className={cn(cardClass("tint"), "flex flex-col")} data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink p-5">
        <h3 className="title flex items-center gap-3 text-[clamp(1.375rem,2.2vw,1.75rem)]">
          <Sparkles aria-hidden="true" className="size-6 shrink-0" />
          Feedback
        </h3>
        {average && (
          <p className="title flex items-center gap-2 text-xl">
            <Star aria-hidden="true" className="size-5 shrink-0 fill-ink" />
            {average}/5.0
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-6 p-5">
        <p>
          <span className="title block text-[clamp(2rem,3.5vw,2.75rem)]">{pad(testimonials.length)}</span>
          <span className="text-sm">{testimonials.length === 1 ? "client review" : "client reviews"}</span>
        </p>
        <StartProjectButton variant="white" size="sm" className="self-start">
          Start project
        </StartProjectButton>
      </div>
    </div>
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
