# Admin Panel — Design

Date: 2026-09-27
Status: Approved in conversation, pending written-spec review

## Goal

Give the site owner a private `/admin` area to create, edit, reorder and delete every content section of the
portfolio, and to manage incoming project requests. Content moves from hard-coded `src/content/*.ts` files to
MongoDB, images are stored on ImageKit, and email goes through Resend. Edits appear on the public site without
a redeploy.

## Decisions (from brainstorming)

- Single admin account, **email + password** login. No forgot-password email; a CLI script resets it.
- Project requests are **saved to MongoDB and shown in an admin inbox**, and still emailed to the owner.
- Resend also sends an **auto-reply to the client** and **replies written from the admin inbox**. The inquiry
  form therefore gains a required client **email** field.
- **Approach A:** hand-built admin inside this Next.js app. No auth library, no ORM, no CMS.

## Non-goals

- Multiple admins, roles, or invitations.
- Forgot-password emails, 2FA.
- Draft/preview workflow or content version history.
- A rich-text editor — long text fields are plain textareas (paragraphs split on blank lines where the page
  already renders arrays of paragraphs).

## Dependencies added

| Package | Why |
| --- | --- |
| `mongodb` | Official driver |
| `zod` | Validation of every admin input and inquiry |
| `jose` | Signing/verifying the session JWT (works in `proxy.ts`) |
| `bcryptjs` | Password hashing (pure JS, no native build) |
| `vitest`, `mongodb-memory-server` (dev) | Unit and repository tests |

ImageKit and Resend are called through their REST APIs with `fetch`; no SDKs. ImageKit upload signatures are
generated with Node `crypto` (HMAC-SHA1 of `token + expire` with the private key).

## Data model (MongoDB)

All documents carry `createdAt` / `updatedAt`. Ordered collections carry a numeric `sortOrder`; the "01",
"02" display numbers are derived from position at read time and are no longer stored.

Images are stored as `ImageRef = { url: string; fileId: string; alt: string }`.

| Collection | Fields |
| --- | --- |
| `settings` (single doc, `_id: "site"`) | brand, name, title, description, role, focus, location, availability (`available`/`limited`/`unavailable`), email, portrait?: ImageRef, resumeUrl?, social { github?, fiverr?, upwork? }, builtWith, openTo, year, hero { lines: string[], accentLine: number, roles }, about { intro: string[] }, inquiryServices: string[], autoReplyMessage: string |
| `projects` | slug (unique), title, description, year, category[], technologies[], image?: ImageRef, featured, client?, role?, overview?, problem?, approach?, features[], engineering?, result?, metrics[{label, value}], liveUrl?, githubUrl?, sortOrder |
| `services` | title, description, includes[], sortOrder |
| `processSteps` | title, description, sortOrder |
| `experience` | role, company, period, sortOrder |
| `stackGroups` | label, items[], sortOrder |
| `testimonials` | quote, name, role?, company?, avatar?: ImageRef, rating? (1–5, one decimal), published, sortOrder |
| `inquiries` | name, email, phone, services[], businessDetails, status (`new`/`read`/`replied`/`archived`), emailFailed: boolean, replies[{ subject, body, sentAt, delivered }], createdAt |
| `admins` | email (unique, lowercased), passwordHash, sessionVersion (number) |

`siteConfig.url` stays in env (`NEXT_PUBLIC_SITE_URL`); `navigation`, `availabilityLabels` and `socialLabels`
stay in code — they are structure, not content.

## Code structure

```
src/lib/db/client.ts            Mongo client singleton (cached on globalThis in dev), getDb()
src/lib/db/schemas.ts           zod schemas + inferred types for every collection
src/lib/db/<collection>.ts      repository per collection: list/get (cached, tagged) + create/update/delete/reorder
src/lib/content.ts              public read API used by pages: getSettings(), getProjects(), getServices(), ...
src/lib/auth/password.ts        hash/verify (bcryptjs)
src/lib/auth/session.ts         create/verify/delete session cookie (jose)
src/lib/auth/dal.ts             requireAdmin() — verifies cookie AND sessionVersion against the admins doc
src/lib/rate-limit.ts           in-memory limiter (extracted from inquiry-action.ts, reused by login)
src/lib/imagekit.ts             getUploadAuth(), deleteFile(fileId), image URL helper with transformations
src/lib/mail.ts                 sendEmail() core + inquiry notification, client auto-reply, admin reply
src/proxy.ts                    optimistic redirect of /admin/* (except /admin/login) when no valid session cookie
src/app/admin/...               admin routes (below)
src/app/api/admin/imagekit-auth/route.ts
src/components/admin/...        admin UI: shell/sidebar, forms, list editor, image uploader, confirm dialog
scripts/seed.ts                 imports current src/content/*.ts into MongoDB (idempotent: skips non-empty collections)
scripts/create-admin.ts         creates or resets the admin from ADMIN_EMAIL / ADMIN_PASSWORD
```

After seeding, `src/content/*.ts` data files are removed (seed data moves under `scripts/seed-data/`); every
public page and component reads through `src/lib/content.ts`. `src/lib/projects.ts` helpers keep their names
but become async and take data from the repository.

## Caching and revalidation

Reads used by public pages are wrapped in Next's cache with per-collection tags (`settings`, `projects`,
`services`, `process`, `experience`, `stack`, `testimonials`). Every admin mutation calls the matching tag
revalidation after a successful write. The implementation plan must follow the caching guide shipped in
`node_modules/next/dist/docs/` for Next 16.3 (the app does not currently enable `cacheComponents`; the plan
picks the documented API for that mode). `/work/[slug]` keeps `generateStaticParams` from the database and
allows new slugs to render on demand. Sitemap reads projects from the database.

If MongoDB is unreachable, cached pages continue to serve; an uncached public read throws and hits the error
boundary.

## Admin routes

All under `src/app/admin`, `robots: noindex`, own layout (sidebar on desktop, top menu on mobile), styled
with the site's existing tokens and `Card` components.

| Route | Purpose |
| --- | --- |
| `/admin/login` | Email + password form |
| `/admin` | Dashboard: counts per section, latest unread inquiries, "View site" link |
| `/admin/settings` | Profile, availability, socials, portrait upload, resume URL, hero, about intro, inquiry service options, auto-reply message |
| `/admin/projects` | List with reorder, featured toggle, delete |
| `/admin/projects/new`, `/admin/projects/[id]` | Full project form incl. cover image, features and metrics lists |
| `/admin/services`, `/admin/process`, `/admin/experience`, `/admin/stack` | List editors: inline add/edit/delete, up/down reorder |
| `/admin/testimonials` | List editor plus avatar upload, rating, published toggle |
| `/admin/inquiries` | Inbox filtered by status, unread highlight, "email failed" flag |
| `/admin/inquiries/[id]` | Request detail, status change, reply composer (Resend), reply thread |
| `/admin/account` | Change password (requires current password) |

Mutations are Server Actions using `useActionState`; each returns `{ ok: true } | { ok: false, errors }`,
keeps user input on failure, and shows pending/success/error state. Deletes require confirmation.

## Authentication and security

- Login action: zod-validate, rate-limit per IP and per email (5 attempts / 15 min), bcrypt compare against
  the single `admins` doc, identical error message for unknown email or wrong password.
- Session: JWT (HS256, `SESSION_SECRET`, ≥32 chars) with `{ adminId, sessionVersion }`, 7-day expiry, cookie
  `httpOnly`, `secure` in production, `sameSite: "lax"`, `path: "/"`.
- `proxy.ts` only does an optimistic JWT check and redirect. `requireAdmin()` is the real gate: called at the
  top of every admin page, every admin Server Action and the ImageKit auth route; it also compares
  `sessionVersion` with the DB so changing the password signs out other sessions.
- Logout deletes the cookie.
- Every admin write is validated by zod server-side; URLs are restricted to `http(s):`; ImageRef URLs must
  start with `IMAGEKIT_URL_ENDPOINT`.

## Images (ImageKit)

- `GET /api/admin/imagekit-auth` (admin only) returns `{ token, expire, signature, publicKey }` valid for
  ≤10 minutes.
- The browser uploader posts the file directly to ImageKit's upload API into `/portfolio/{projects|portrait|testimonials}`;
  client-side check: image MIME types only, ≤5 MB.
- On save, a replaced or removed image's old `fileId` is deleted via ImageKit's API (failures are logged, never
  block the save). Deleting a project/testimonial deletes its image too.
- Rendering uses ImageKit URL transformations (`tr=w-…,f-auto`); `next.config.ts` adds the ImageKit host to
  `images.remotePatterns` where `next/image` is used.

## Email (Resend)

One `sendEmail({ to, subject, text, replyTo? })` over the Resend REST API. Without `RESEND_API_KEY`, it logs in
development and returns failure in production (current behaviour).

1. **New inquiry**: `submitInquiry` keeps its honeypot, time trap and rate limit; validates the new `email`
   field; inserts into `inquiries` first; then sends (a) the owner notification to `CONTACT_TO_EMAIL` with a
   link to `/admin/inquiries/[id]`, and (b) the client auto-reply using `autoReplyMessage` plus a summary of
   their request. If either send fails, the inquiry is saved with `emailFailed: true`; the client still sees
   success. If the DB insert fails, the notification email is still attempted; only if both fail does the
   client see an error.
2. **Admin reply**: sent to the client's email with `replyTo` = settings email, stored in `replies[]` with
   `delivered`, status set to `replied`.

Inquiry service options come from `settings.inquiryServices` instead of the hard-coded list.

## Environment variables

Added to `.env.example`: `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
(scripts only), `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`. Existing:
`NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.

`package.json` scripts: `db:seed`, `admin:create`, `test`.

## Testing

- Vitest unit tests: zod schemas, password hash/verify, session sign/verify/expiry, rate limiter, ImageKit
  signature, inquiry flow (Resend and DB mocked: saved + emailed, email-fail flag, DB-fail fallback).
- Repository tests against `mongodb-memory-server`: CRUD, reorder, slug uniqueness, seed idempotency.
- `requireAdmin` tests: missing cookie, bad signature, stale `sessionVersion`.
- Before completion: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, then a Playwright
  click-through: login, edit each section, upload an image, submit an inquiry, reply from the inbox, confirm
  public pages reflect edits.
