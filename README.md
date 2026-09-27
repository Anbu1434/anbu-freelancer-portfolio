# VECNA.DEV — Freelance Portfolio

A clean brutalist portfolio built with Next.js (App Router), TypeScript and Tailwind CSS v4.
The design and engineering spec lives in `freelancer_brutalist_portfolio_clean_minimal_master_spec.md`.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build
```

## Editing content

Everything personal lives in `src/content/` — components never hardcode it.

| File | What it holds |
| --- | --- |
| `site.ts` | Name, brand, email, socials, availability, hero and about copy |
| `projects.ts` | Projects and case-study content |
| `experience.ts` | Work history shown on the About page (empty array hides the section) |
| `services.ts` | Services and the working process |
| `testimonials.ts` | Client reviews on the home page (empty array hides the section) |
| `stack.ts` | Technology inventory |

Project images go in `public/work/` and are referenced as `image: "/work/<file>.png"`.
Without an image, a typography-led placeholder is shown.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for metadata, sitemap and structured data |
| `RESEND_API_KEY` | Enables contact-form delivery via [Resend](https://resend.com) |
| `CONTACT_TO_EMAIL` | Inbox that receives enquiries (defaults to `siteConfig.email`) |
| `CONTACT_FROM_EMAIL` | Verified sender, e.g. `Portfolio <hello@your-domain.com>` |

Without `RESEND_API_KEY`, enquiries are logged to the console in development and the form reports
a failure in production, so no message is ever silently lost.
