# AnbuDev — Freelance Portfolio

A clean brutalist portfolio built with Next.js (App Router), TypeScript and Tailwind CSS v4, with a private admin
panel for editing every section. Content lives in MongoDB, images on ImageKit, and email goes through Resend.
The design and engineering spec lives in `freelancer_brutalist_portfolio_clean_minimal_master_spec.md`; the admin
panel's design is in `docs/superpowers/specs/2026-09-27-admin-panel-design.md`.

## Commands

```bash
npm install
npm run dev           # http://localhost:3000
npm run lint
npm run typecheck
npm test              # unit + repository tests (in-memory MongoDB; first run downloads a MongoDB binary)
npm run build         # reads from MongoDB — the build environment needs MONGODB_URI
npm run db:seed       # import the original site content into MongoDB (skips collections that have data)
npm run admin:create  # create the admin account, or reset its password (signs out every session)
```

## Admin panel

Sign in at `/admin/login`. From there you can edit:

| Section | What it controls |
| --- | --- |
| Settings | Brand (browser tab + logo), name, contact email, availability, portrait, resume, social links, about text, share-image text, the services clients can pick in "Start project", and the auto-reply message |
| Projects | Everything on `/work` and each case study, cover images, featured projects on the home page, order |
| Services / Process | The Services page |
| Experience / Tech stack | The About page (no experience entries hides that section) |
| Testimonials | Client reviews on the home page, with publish/unpublish (none published hides the section) |
| Inquiries | Every "Start project" request: read, archive, and reply by email |
| Account | Change your password (signs out your other devices) |

Saving refreshes the affected public pages immediately — no redeploy needed. Only publish real client feedback and
real outcomes; leave a field empty rather than inventing it.

## First-time setup

1. Copy `.env.example` to `.env.local` and fill in every value (see below).
2. `npm run db:seed` — imports the starting content.
3. `npm run admin:create` — creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Remove `ADMIN_PASSWORD` from
   `.env.local` afterwards. Forgot the password? Set a new one there and run the command again.
4. `npm run dev` and sign in at `/admin/login`.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used for metadata, sitemap, structured data and links in emails |
| `MONGODB_URI`, `MONGODB_DB` | MongoDB connection (a free MongoDB Atlas cluster works) and database name |
| `SESSION_SECRET` | 32+ random characters used to sign admin sessions, e.g. `openssl rand -base64 48` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only read by `npm run admin:create`; password must be 12+ characters |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | ImageKit → Developer options. Uploads go to `/portfolio/...` in your media library |
| `RESEND_API_KEY` | Enables email via [Resend](https://resend.com) |
| `CONTACT_TO_EMAIL` | Inbox that receives new project requests (defaults to the email in Settings) |
| `CONTACT_FROM_EMAIL` | Verified sender, e.g. `Portfolio <hello@your-domain.com>`. The domain must be verified in Resend, otherwise Resend only delivers to your own address and client auto-replies fail |

### How project requests work

Each request is saved to MongoDB first, then two emails go out: a notification to you (with a link to the request in
the admin) and an auto-reply to the client. If an email fails, the request is still saved and flagged "Email failed"
in the inbox. Without `RESEND_API_KEY`, emails are printed to the terminal in development; in production they fail
and the request is flagged.

### Images

Uploads go straight from the browser to ImageKit (up to 5 MB, images only). Replacing or deleting an image also
deletes the old file. Using a custom ImageKit domain? Add it to `images.remotePatterns` in `next.config.ts`.
