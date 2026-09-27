# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A private `/admin` area that manages every portfolio section and project inquiries, backed by MongoDB, ImageKit and Resend.

**Architecture:** Content moves from `src/content/*.ts` into MongoDB collections behind small repository modules (`src/lib/db/*`). Public pages read through a cached content layer (`src/lib/content.ts`, `unstable_cache` + tags); admin Server Actions validate with zod, write through the repositories and expire the matching tag. Admin auth is a bcrypt-hashed single account with a jose-signed session cookie, checked by `requireAdmin()` on every admin page and action (plus an optimistic redirect in `src/proxy.ts`). Images upload browser→ImageKit with a server-issued signature; emails go through Resend's REST API.

**Tech Stack:** Next.js 16.3 (App Router, Server Actions), React 19.2, TypeScript, Tailwind 4, `mongodb` 7, `zod` 4, `jose` 6, `bcryptjs` 3, Vitest 5 + `mongodb-memory-server` 11, `tsx` for scripts.

**Spec:** `docs/superpowers/specs/2026-09-27-admin-panel-design.md`

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before using a Next API (AGENTS.md). Confirmed for this plan: `revalidateTag(tag, profile)` needs two arguments (single-arg form is deprecated); `updateTag` only works with `'use cache'`/`fetch` tags, so this plan uses `revalidateTag(tag, { expire: 0 })`; middleware is now `proxy.ts` exporting `proxy`; `cacheComponents` is **not** enabled, so caching uses `unstable_cache`.
- No SDKs for ImageKit or Resend — `fetch` to their REST APIs only.
- Every admin page calls `requireAdmin()` first; every admin Server Action calls `requireAdmin()` first; the ImageKit auth route calls `getAdmin()` and returns 401.
- Session cookie: `httpOnly`, `secure` in production, `sameSite: "lax"`, `path: "/"`, 7-day expiry; `SESSION_SECRET` ≥ 32 chars.
- Login rate limit: 5 attempts / 15 min per IP and per email; identical error text for unknown email and wrong password.
- Uploads: image MIME types only, ≤ 5 MB, folders `/portfolio/projects`, `/portfolio/portrait`, `/portfolio/testimonials`.
- Stored image shape: `{ url: string; fileId: string; alt: string }`; `url` must start with `IMAGEKIT_URL_ENDPOINT`.
- Display numbers ("01", "02") are derived from `sortOrder` position at read time, never stored.
- Never invent content: seed data is copied from the current `src/content/*.ts` unchanged.
- Match existing code style: 2-space indent, double quotes, `@/` imports, `cn()` for classes, existing CSS classes (`btn`, `btn-primary|secondary|accent|white`, `btn-sm`, `field`, `field-error`, `meta`, `title`, `select`) and `cardClass()`/`Card`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work happens on branch `feature/admin-panel`.

## Review Focus

1. **A deleted or renamed project slug that is still linked/cached** — visiting `/work/<old-slug>` must 404, not crash. Pinned by the `getProject` test in Task 4.
2. **Removing an optional field in the admin (e.g. clearing `client` or the portrait)** must actually remove it from the stored document, not leave the old value. Pinned by the "update removes cleared optional fields" repository test in Task 2.
3. **Changing the password must sign out other sessions** (a stolen cookie stops working). Pinned by the `resolveAdmin` stale-version test in Task 5.
4. **An inquiry when Resend or MongoDB is down** — client still sees success if either the save or the owner email worked; the inquiry is flagged `emailFailed`. Pinned by the `processInquiry` tests in Task 6.
5. **Inquiry services edited in settings after a visitor opened the form** — a service name that no longer exists must be rejected server-side with a field error, not stored. Pinned by the "rejects unknown service" test in Task 6.

---

## File map

```
Create
  vitest.config.mts
  src/test/mongo.ts                         memory-server helper for repository tests
  src/lib/db/client.ts                      getDb(), closeDb(), ensureIndexes()
  src/lib/db/schemas.ts                     zod schemas + types for all content
  src/lib/db/ordered-repo.ts                generic CRUD + reorder repository
  src/lib/db/repos.ts                       one ordered repo per collection
  src/lib/db/settings.ts                    findSettings(), saveSettings()
  src/lib/db/inquiries.ts                   inbox repository
  src/lib/db/admins.ts                      admin account repository
  src/lib/content.ts                        cached public read API + view mappers
  src/lib/site-constants.ts                 navigation, availabilityLabels, socialLabels
  src/lib/rate-limit.ts                     createRateLimiter()
  src/lib/request.ts                        clientIp()
  src/lib/auth/password.ts                  hashPassword(), verifyPassword()
  src/lib/auth/session.ts                   signSession(), verifySession() (edge-safe)
  src/lib/auth/session-cookie.ts            setSessionCookie(), clearSessionCookie()
  src/lib/auth/dal.ts                       resolveAdmin(), getAdmin(), requireAdmin()
  src/lib/imagekit.ts                       getUploadAuth(), deleteImage(), deleteReplacedImages()
  src/lib/inquiry-flow.ts                   processInquiry() (pure, testable)
  src/lib/admin/action-result.ts            ActionResult, invalid(), failed()
  src/lib/admin/refresh.ts                  refresh(...tags)
  src/lib/admin/collection-actions.ts       collectionActions() factory
  src/lib/admin/paths.ts                    getPath(), setPath()
  src/proxy.ts
  src/app/(site)/layout.tsx                 public chrome (moved from app/layout.tsx)
  src/app/(site)/not-found.tsx
  src/components/layout/site-chrome.tsx     shared chrome for (site)/layout and app/not-found
  src/components/layout/not-found-content.tsx
  src/app/admin/layout.tsx                  noindex metadata
  src/app/admin/login/{page.tsx,actions.ts,login-form.tsx}
  src/app/admin/(panel)/layout.tsx          shell + requireAdmin
  src/app/admin/(panel)/{page.tsx,actions.ts}
  src/app/admin/(panel)/settings/{page.tsx,actions.ts}
  src/app/admin/(panel)/account/{page.tsx,actions.ts,password-form.tsx}
  src/app/admin/(panel)/{services,process,experience,stack,testimonials}/{page.tsx,actions.ts}
  src/app/admin/(panel)/projects/{page.tsx,actions.ts,project-list.tsx,new/page.tsx,[id]/page.tsx}
  src/app/admin/(panel)/inquiries/{page.tsx,actions.ts,[id]/page.tsx,[id]/reply-form.tsx,[id]/status-form.tsx}
  src/app/api/admin/imagekit-auth/route.ts
  src/components/admin/{admin-nav.tsx,entity-form.tsx,field-input.tsx,image-field.tsx,ordered-list-editor.tsx,field-configs.ts}
  scripts/seed.ts, scripts/create-admin.ts, scripts/seed-data/* (moved from src/content)
  tests next to their modules as *.test.ts
Move
  src/app/{page.tsx,about,services,work} → src/app/(site)/
  src/content/*.ts → scripts/seed-data/*.ts
Modify
  package.json, .env.example, next.config.ts, README.md
  src/app/layout.tsx, src/app/not-found.tsx, src/app/opengraph-image.tsx, src/app/robots.ts, src/app/sitemap.ts
  src/lib/{seo.ts,projects.ts,mail.ts,inquiry.ts,inquiry-action.ts}
  src/components/{layout/*, home/profile-card.tsx, about/about-card.tsx, contact/cta-card.tsx,
                  testimonials/reviews.tsx, ui/availability.tsx, ui/social-links.tsx,
                  inquiry/inquiry-provider.tsx, inquiry/inquiry-dialog.tsx}
Delete
  src/content/ (after move)
```

---

### Task 0: Baseline commit, dependencies, test runner, env

**Files:**
- Modify: `package.json`, `.env.example`
- Create: `vitest.config.mts`, `src/lib/rate-limit.test.ts` (smoke test for the runner, kept), `src/lib/rate-limit.ts`

**Interfaces:**
- Produces: `createRateLimiter({ windowMs, max }): { hit(key: string, now?: number): boolean; reset(key: string): void }` — `hit` returns `true` when the key is already over the limit (the attempt is not recorded then).

- [ ] **Step 1: Commit the existing project as a baseline** (ask the user first — the repo currently has only the spec committed and everything else untracked; a baseline commit makes every later diff reviewable)

```bash
git add -A
git commit -m "chore: baseline portfolio before admin panel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 2: Install dependencies**

```bash
npm install mongodb@^7 zod@^4 jose@^6 bcryptjs@^3
npm install -D vitest@^5 mongodb-memory-server@^11 tsx@^4
```

- [ ] **Step 3: Add scripts to `package.json`** (keep existing ones)

```json
"test": "vitest run",
"test:watch": "vitest",
"db:seed": "tsx --env-file=.env.local scripts/seed.ts",
"admin:create": "tsx --env-file=.env.local scripts/create-admin.ts"
```

- [ ] **Step 4: Create `vitest.config.mts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
```

- [ ] **Step 5: Write the failing test `src/lib/rate-limit.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to max hits in the window, then limits", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.hit("a", 0)).toBe(false);
    expect(limiter.hit("a", 10)).toBe(false);
    expect(limiter.hit("a", 20)).toBe(true);
    expect(limiter.hit("b", 20)).toBe(false);
  });

  it("forgets hits older than the window", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    expect(limiter.hit("a", 0)).toBe(false);
    expect(limiter.hit("a", 500)).toBe(true);
    expect(limiter.hit("a", 1001)).toBe(false);
  });

  it("reset clears a key", () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.hit("a", 0);
    limiter.reset("a");
    expect(limiter.hit("a", 1)).toBe(false);
  });
});
```

- [ ] **Step 6: Run** `npm test -- src/lib/rate-limit.test.ts` — Expected: FAIL, cannot resolve `@/lib/rate-limit`.

- [ ] **Step 7: Create `src/lib/rate-limit.ts`**

```ts
/** Best-effort, per-instance sliding-window limiter. Good enough to blunt casual abuse on a portfolio. */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records an attempt and returns true when the key was already over the limit. */
    hit(key: string, now = Date.now()) {
      if (hits.size > 1000) hits.clear();
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      const limited = recent.length >= max;
      if (!limited) recent.push(now);
      hits.set(key, recent);
      return limited;
    },
    reset(key: string) {
      hits.delete(key);
    },
  };
}
```

- [ ] **Step 8: Run** `npm test -- src/lib/rate-limit.test.ts` — Expected: 3 passed.

- [ ] **Step 9: Replace `.env.example`**

```bash
NEXT_PUBLIC_SITE_URL=https://vecna.dev

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.example.mongodb.net
MONGODB_DB=portfolio

# Admin auth — SESSION_SECRET: at least 32 random characters (e.g. `openssl rand -base64 48`)
SESSION_SECRET=
# Only read by `npm run admin:create`
ADMIN_EMAIL=
ADMIN_PASSWORD=

# ImageKit (Dashboard → Developer options)
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Resend
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
```

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.mts .env.example src/lib/rate-limit.ts src/lib/rate-limit.test.ts
git commit -m "chore: add admin dependencies, vitest and rate limiter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Mongo client and zod schemas

**Files:**
- Create: `src/lib/db/client.ts`, `src/lib/db/schemas.ts`, `src/lib/db/schemas.test.ts`, `src/test/mongo.ts`

**Interfaces:**
- Produces:
  - `getDb(): Promise<Db>`, `closeDb(): Promise<void>`, `ensureIndexes(): Promise<void>`, `collections` name map.
  - Schemas + inferred types: `imageRefSchema`/`ImageRef`, `settingsSchema`/`Settings`, `serviceSchema`/`ServiceInput`, `processStepSchema`/`ProcessStepInput`, `experienceSchema`/`ExperienceInput`, `stackGroupSchema`/`StackGroupInput`, `testimonialSchema`/`TestimonialInput`, `projectSchema`/`ProjectInput`, `loginSchema`, `passwordChangeSchema`, `replySchema`, `inquiryStatuses`, `InquiryStatus`, `availabilityValues`.
  - `setupTestDb()` for repository tests.

- [ ] **Step 1: Create `src/lib/db/client.ts`**

```ts
import { MongoClient, type Db } from "mongodb";

export const collections = {
  settings: "settings",
  projects: "projects",
  services: "services",
  processSteps: "processSteps",
  experience: "experience",
  stackGroups: "stackGroups",
  testimonials: "testimonials",
  inquiries: "inquiries",
  admins: "admins",
} as const;

// Reused across hot reloads in dev and across calls in one serverless instance.
const globalForMongo = globalThis as unknown as { mongoClient?: Promise<MongoClient> };

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set.");
  // ignoreUndefined: optional fields left undefined are omitted instead of stored as null.
  globalForMongo.mongoClient ??= new MongoClient(uri, { ignoreUndefined: true }).connect();
  return globalForMongo.mongoClient;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(process.env.MONGODB_DB || "portfolio");
}

export async function closeDb() {
  const client = globalForMongo.mongoClient;
  globalForMongo.mongoClient = undefined;
  if (client) await (await client).close();
}

/** Called by the seed and admin scripts, and by tests. Safe to run repeatedly. */
export async function ensureIndexes() {
  const db = await getDb();
  await db.collection(collections.projects).createIndex({ slug: 1 }, { unique: true });
  await db.collection(collections.admins).createIndex({ email: 1 }, { unique: true });
  await db.collection(collections.inquiries).createIndex({ status: 1, createdAt: -1 });
}
```

- [ ] **Step 2: Create `src/test/mongo.ts`**

```ts
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { closeDb, ensureIndexes, getDb } from "@/lib/db/client";

/** Starts one in-memory MongoDB per test file and empties it before each test. */
export function setupTestDb() {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    process.env.MONGODB_URI = server.getUri();
    process.env.MONGODB_DB = "test";
  });

  beforeEach(async () => {
    await (await getDb()).dropDatabase();
    await ensureIndexes();
  });

  afterAll(async () => {
    await closeDb();
    await server.stop();
  });
}
```

- [ ] **Step 3: Write the failing test `src/lib/db/schemas.test.ts`**

```ts
import { beforeAll, describe, expect, it } from "vitest";
import { projectSchema, settingsSchema, testimonialSchema } from "@/lib/db/schemas";

beforeAll(() => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
});

const validSettings = {
  brand: "AnbuDev",
  name: "Anbu",
  title: "Full-Stack Developer",
  description: "I build digital products.",
  role: "Full-stack developer",
  focus: "Web / Product / AI",
  location: "India / Remote",
  availability: "available",
  email: "hello@example.com",
  year: "2026",
  resumeUrl: "",
  social: { github: "https://github.com/me", fiverr: "", upwork: "" },
  builtWith: "Next.js",
  openTo: "Freelance",
  hero: { lines: ["I build", "digital", "products."], accentLine: 1, roles: "Full-stack" },
  about: { intro: ["First paragraph."] },
  inquiryServices: ["Website Development"],
  autoReplyMessage: "Thanks — I'll reply within 1–2 business days.",
};

describe("settingsSchema", () => {
  it("accepts valid settings and turns empty optional URLs into undefined", () => {
    const parsed = settingsSchema.parse(validSettings);
    expect(parsed.resumeUrl).toBeUndefined();
    expect(parsed.social.fiverr).toBeUndefined();
    expect(parsed.social.github).toBe("https://github.com/me");
  });

  it("rejects an accent line outside the hero lines", () => {
    const result = settingsSchema.safeParse({ ...validSettings, hero: { ...validSettings.hero, accentLine: 3 } });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["hero", "accentLine"]);
  });

  it("rejects javascript: URLs", () => {
    const result = settingsSchema.safeParse({ ...validSettings, resumeUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("rejects a portrait not hosted on the ImageKit endpoint", () => {
    const result = settingsSchema.safeParse({
      ...validSettings,
      portrait: { url: "https://evil.example/x.png", fileId: "f1", alt: "" },
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  const base = {
    slug: "lms-platform",
    title: "LMS",
    description: "Learning platform.",
    year: "2026",
    category: ["Web application"],
    technologies: ["React"],
    featured: true,
    features: [],
    metrics: [],
    client: "",
  };

  it("accepts a minimal project and drops empty optional text", () => {
    const parsed = projectSchema.parse(base);
    expect(parsed.client).toBeUndefined();
  });

  it("rejects slugs with spaces or capitals", () => {
    expect(projectSchema.safeParse({ ...base, slug: "My Project" }).success).toBe(false);
  });
});

describe("testimonialSchema", () => {
  it("rounds rating to one decimal and bounds it to 1–5", () => {
    expect(testimonialSchema.parse({ quote: "Great", name: "A", published: true, rating: 4.86 }).rating).toBe(4.9);
    expect(testimonialSchema.safeParse({ quote: "Great", name: "A", published: true, rating: 6 }).success).toBe(false);
  });
});
```

- [ ] **Step 4: Run** `npm test -- src/lib/db/schemas.test.ts` — Expected: FAIL, cannot resolve `@/lib/db/schemas`.

- [ ] **Step 5: Create `src/lib/db/schemas.ts`**

```ts
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1, "Required.").max(max, `Keep this under ${max} characters.`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .optional()
    .transform((value) => value || undefined);
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https?:\/\/\S+$/, "Must be a full URL starting with http:// or https://.");
const optionalUrl = z
  .union([httpUrl, z.literal("")])
  .optional()
  .transform((value) => value || undefined);
const stringList = (max: number) => z.array(z.string().trim().min(1, "Remove empty items.").max(max)).max(50);

export const imageRefSchema = z.object({
  url: httpUrl.refine(
    (url) => url.startsWith(process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/"),
    "Images must be uploaded to ImageKit.",
  ),
  fileId: z.string().trim().min(1).max(100),
  alt: z.string().trim().max(200),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

export const availabilityValues = ["available", "limited", "unavailable"] as const;

export const settingsSchema = z.object({
  brand: text(60),
  name: text(100),
  title: text(100),
  description: text(300),
  role: text(100),
  focus: text(100),
  location: text(100),
  availability: z.enum(availabilityValues),
  email: z.email("Enter a valid email.").max(200),
  year: text(10),
  portrait: imageRefSchema.optional(),
  resumeUrl: optionalUrl,
  social: z.object({ github: optionalUrl, fiverr: optionalUrl, upwork: optionalUrl }),
  builtWith: text(200),
  openTo: text(200),
  hero: z
    .object({
      lines: stringList(40).min(1, "Add at least one line."),
      accentLine: z.number().int().min(0),
      roles: text(200),
    })
    .refine((hero) => hero.accentLine < hero.lines.length, {
      message: "Pick a line that exists (0 = first line).",
      path: ["accentLine"],
    }),
  about: z.object({ intro: stringList(1000).min(1, "Add at least one paragraph.") }),
  inquiryServices: stringList(60).min(1, "Add at least one service."),
  autoReplyMessage: text(2000),
});
export type Settings = z.infer<typeof settingsSchema>;

export const serviceSchema = z.object({
  title: text(80),
  description: text(300),
  includes: stringList(120),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const processStepSchema = z.object({ title: text(80), description: text(500) });
export type ProcessStepInput = z.infer<typeof processStepSchema>;

export const experienceSchema = z.object({ role: text(100), company: text(100), period: text(60) });
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const stackGroupSchema = z.object({ label: text(40), items: stringList(40).min(1, "Add at least one item.") });
export type StackGroupInput = z.infer<typeof stackGroupSchema>;

export const testimonialSchema = z.object({
  quote: text(1000),
  name: text(100),
  role: optionalText(100),
  company: optionalText(100),
  avatar: imageRefSchema.optional(),
  rating: z
    .number()
    .min(1, "Between 1 and 5.")
    .max(5, "Between 1 and 5.")
    .optional()
    .transform((value) => (value === undefined ? undefined : Math.round(value * 10) / 10)),
  published: z.boolean(),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const projectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Required.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and single dashes only."),
  title: text(120),
  description: text(300),
  year: text(10),
  category: stringList(40).min(1, "Add at least one category."),
  technologies: stringList(40).min(1, "Add at least one technology."),
  image: imageRefSchema.optional(),
  featured: z.boolean(),
  client: optionalText(120),
  role: optionalText(120),
  overview: optionalText(3000),
  problem: optionalText(3000),
  approach: optionalText(3000),
  features: stringList(200),
  engineering: optionalText(3000),
  result: optionalText(3000),
  metrics: z.array(z.object({ label: text(60), value: text(30) })).max(12),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const inquiryStatuses = ["new", "read", "replied", "archived"] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const loginSchema = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

export const passwordChangeSchema = z
  .object({
    current: z.string().min(1, "Required."),
    next: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string(),
  })
  .refine((value) => value.next === value.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export const replySchema = z.object({ subject: text(200), body: text(10_000) });
```

- [ ] **Step 6: Run** `npm test -- src/lib/db/schemas.test.ts` — Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db src/test
git commit -m "feat(db): mongo client and zod content schemas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Repositories

**Files:**
- Create: `src/lib/db/ordered-repo.ts`, `src/lib/db/repos.ts`, `src/lib/db/settings.ts`, `src/lib/db/inquiries.ts`, `src/lib/db/admins.ts`
- Test: `src/lib/db/ordered-repo.test.ts`, `src/lib/db/inquiries.test.ts`, `src/lib/db/admins.test.ts`

**Interfaces:**
- Consumes: `getDb`, `collections`, schema types (Task 1).
- Produces:
  - `type Stored<T> = T & { id: string; sortOrder: number; createdAt: string; updatedAt: string }`
  - `createOrderedRepo<T extends object>(name)` → `{ list(filter?): Promise<Stored<T>[]>; get(id): Promise<Stored<T> | null>; findOne(filter): Promise<Stored<T> | null>; count(): Promise<number>; create(data: T): Promise<string>; update(id, data: T): Promise<{ before: Stored<T>; after: Stored<T> } | null>; patch(id, fields: Partial<T>): Promise<boolean>; remove(id): Promise<Stored<T> | null>; move(id, direction: "up" | "down"): Promise<boolean> }`
  - `repos.{projects,services,processSteps,experience,stackGroups,testimonials}`
  - `findSettings(): Promise<Settings | null>`, `saveSettings(data: Settings): Promise<Settings | null>` (returns previous)
  - `type Inquiry`, `type InquiryReply`, `createInquiry(values: InquiryValues): Promise<string>`, `listInquiries(status?)`, `getInquiry(id)`, `setInquiryStatus(id, status)`, `markEmailFailed(id)`, `addReply(id, reply)`, `countInquiries(status?)`
  - `type Admin = { id: string; email: string; passwordHash: string; sessionVersion: number }`, `findAdminByEmail(email)`, `findAdminById(id)`, `upsertAdmin(email, passwordHash): Promise<Admin>`, `updatePassword(id, passwordHash): Promise<number | null>` (new sessionVersion)

- [ ] **Step 1: Write the failing test `src/lib/db/ordered-repo.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { createOrderedRepo } from "@/lib/db/ordered-repo";
import { repos } from "@/lib/db/repos";
import { setupTestDb } from "@/test/mongo";

setupTestDb();

type Item = { title: string; note?: string };
const repo = createOrderedRepo<Item>("services");

describe("ordered repository", () => {
  it("creates items at the end and lists them in order", async () => {
    await repo.create({ title: "A" });
    await repo.create({ title: "B" });
    const items = await repo.list();
    expect(items.map((item) => item.title)).toEqual(["A", "B"]);
    expect(items[0].sortOrder).toBeLessThan(items[1].sortOrder);
    expect(typeof items[0].id).toBe("string");
    expect(typeof items[0].createdAt).toBe("string");
  });

  it("update removes cleared optional fields and keeps sortOrder", async () => {
    const id = await repo.create({ title: "A", note: "old" });
    const result = await repo.update(id, { title: "A2" });
    expect(result?.before.note).toBe("old");
    const after = await repo.get(id);
    expect(after?.title).toBe("A2");
    expect(after && "note" in after).toBe(false);
    expect(after?.sortOrder).toBe(result?.before.sortOrder);
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await repo.get("not-an-id")).toBeNull();
    expect(await repo.update("000000000000000000000000", { title: "x" })).toBeNull();
    expect(await repo.remove("nope")).toBeNull();
  });

  it("moves items up and down and stops at the ends", async () => {
    const a = await repo.create({ title: "A" });
    const b = await repo.create({ title: "B" });
    expect(await repo.move(b, "up")).toBe(true);
    expect((await repo.list()).map((item) => item.title)).toEqual(["B", "A"]);
    expect(await repo.move(a, "down")).toBe(false);
  });

  it("removes and returns the removed item", async () => {
    const id = await repo.create({ title: "A" });
    expect((await repo.remove(id))?.title).toBe("A");
    expect(await repo.count()).toBe(0);
  });

  it("patch sets only the given fields", async () => {
    const id = await repo.create({ title: "A", note: "keep" });
    await repo.patch(id, { title: "B" });
    expect(await repo.get(id)).toMatchObject({ title: "B", note: "keep" });
  });

  it("enforces unique project slugs", async () => {
    const project = {
      slug: "one", title: "One", description: "d", year: "2026", category: ["c"], technologies: ["t"],
      featured: false, features: [], metrics: [],
    };
    await repos.projects.create(project);
    await expect(repos.projects.create(project)).rejects.toMatchObject({ code: 11000 });
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/db/ordered-repo.test.ts` — Expected: FAIL, cannot resolve `@/lib/db/ordered-repo`. (First run downloads a MongoDB binary; allow a few minutes.)

- [ ] **Step 3: Create `src/lib/db/ordered-repo.ts`**

```ts
import { ObjectId, type Document, type Filter } from "mongodb";
import { getDb } from "@/lib/db/client";

export type Stored<T> = T & { id: string; sortOrder: number; createdAt: string; updatedAt: string };

export function toObjectId(id: string) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : null;
}

export function toStored<T>(doc: Document): Stored<T> {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return {
    ...(rest as T & { sortOrder: number }),
    id: String(_id),
    createdAt: (createdAt as Date).toISOString(),
    updatedAt: (updatedAt as Date).toISOString(),
  };
}

/** CRUD plus manual ordering for a collection whose documents carry a numeric `sortOrder`. */
export function createOrderedRepo<T extends object>(name: string) {
  const collection = async () => (await getDb()).collection(name);

  return {
    async list(filter: Filter<Document> = {}) {
      const docs = await (await collection()).find(filter).sort({ sortOrder: 1 }).toArray();
      return docs.map((doc) => toStored<T>(doc));
    },

    async get(id: string) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const doc = await (await collection()).findOne({ _id });
      return doc ? toStored<T>(doc) : null;
    },

    async findOne(filter: Filter<Document>) {
      const doc = await (await collection()).findOne(filter);
      return doc ? toStored<T>(doc) : null;
    },

    async count() {
      return (await collection()).countDocuments();
    },

    async create(data: T) {
      const col = await collection();
      const last = await col.find().sort({ sortOrder: -1 }).limit(1).next();
      const now = new Date();
      const result = await col.insertOne({
        ...data,
        sortOrder: last ? (last.sortOrder as number) + 1 : 0,
        createdAt: now,
        updatedAt: now,
      });
      return String(result.insertedId);
    },

    /** Replaces the document so cleared optional fields are removed, keeping order and createdAt. */
    async update(id: string, data: T) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const col = await collection();
      const existing = await col.findOne({ _id });
      if (!existing) return null;
      const replacement = { ...data, sortOrder: existing.sortOrder, createdAt: existing.createdAt, updatedAt: new Date() };
      await col.replaceOne({ _id }, replacement);
      return { before: toStored<T>(existing), after: toStored<T>({ _id, ...replacement }) };
    },

    async patch(id: string, fields: Partial<T>) {
      const _id = toObjectId(id);
      if (!_id) return false;
      const result = await (await collection()).updateOne({ _id }, { $set: { ...fields, updatedAt: new Date() } });
      return result.matchedCount === 1;
    },

    async remove(id: string) {
      const _id = toObjectId(id);
      if (!_id) return null;
      const doc = await (await collection()).findOneAndDelete({ _id });
      return doc ? toStored<T>(doc) : null;
    },

    /** Swaps sortOrder with the neighbouring document. Returns false at either end. */
    async move(id: string, direction: "up" | "down") {
      const _id = toObjectId(id);
      if (!_id) return false;
      const col = await collection();
      const doc = await col.findOne({ _id });
      if (!doc) return false;
      const neighbour = await col
        .find(direction === "up" ? { sortOrder: { $lt: doc.sortOrder } } : { sortOrder: { $gt: doc.sortOrder } })
        .sort({ sortOrder: direction === "up" ? -1 : 1 })
        .limit(1)
        .next();
      if (!neighbour) return false;
      await col.bulkWrite([
        { updateOne: { filter: { _id: doc._id }, update: { $set: { sortOrder: neighbour.sortOrder } } } },
        { updateOne: { filter: { _id: neighbour._id }, update: { $set: { sortOrder: doc.sortOrder } } } },
      ]);
      return true;
    },
  };
}

export type OrderedRepo<T extends object> = ReturnType<typeof createOrderedRepo<T>>;
```

- [ ] **Step 4: Create `src/lib/db/repos.ts`**

```ts
import { collections } from "@/lib/db/client";
import { createOrderedRepo } from "@/lib/db/ordered-repo";
import type {
  ExperienceInput,
  ProcessStepInput,
  ProjectInput,
  ServiceInput,
  StackGroupInput,
  TestimonialInput,
} from "@/lib/db/schemas";

export const repos = {
  projects: createOrderedRepo<ProjectInput>(collections.projects),
  services: createOrderedRepo<ServiceInput>(collections.services),
  processSteps: createOrderedRepo<ProcessStepInput>(collections.processSteps),
  experience: createOrderedRepo<ExperienceInput>(collections.experience),
  stackGroups: createOrderedRepo<StackGroupInput>(collections.stackGroups),
  testimonials: createOrderedRepo<TestimonialInput>(collections.testimonials),
};
```

- [ ] **Step 5: Run** `npm test -- src/lib/db/ordered-repo.test.ts` — Expected: 7 passed.

- [ ] **Step 6: Create `src/lib/db/settings.ts`**

```ts
import { collections, getDb } from "@/lib/db/client";
import type { Settings } from "@/lib/db/schemas";

type SettingsDoc = Settings & { _id: string; updatedAt: Date };

const SETTINGS_ID = "site";

async function collection() {
  return (await getDb()).collection<SettingsDoc>(collections.settings);
}

export async function findSettings(): Promise<Settings | null> {
  const doc = await (await collection()).findOne({ _id: SETTINGS_ID });
  if (!doc) return null;
  const { _id: id, updatedAt, ...settings } = doc;
  void id;
  void updatedAt;
  return settings;
}

/** Replaces the settings document and returns the previous one (for image cleanup). */
export async function saveSettings(data: Settings) {
  const previous = await findSettings();
  await (await collection()).replaceOne({ _id: SETTINGS_ID }, { ...data, _id: SETTINGS_ID, updatedAt: new Date() }, { upsert: true });
  return previous;
}
```

- [ ] **Step 7: Write the failing test `src/lib/db/inquiries.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { addReply, countInquiries, createInquiry, getInquiry, listInquiries, markEmailFailed, setInquiryStatus } from "@/lib/db/inquiries";
import { setupTestDb } from "@/test/mongo";

setupTestDb();

const values = { name: "Ada", email: "ada@example.com", phone: "+91 98765 43210", services: ["SEO"], businessDetails: "A new shop site." };

describe("inquiries repository", () => {
  it("stores a new inquiry with status new", async () => {
    const id = await createInquiry(values);
    const inquiry = await getInquiry(id);
    expect(inquiry).toMatchObject({ ...values, status: "new", emailFailed: false, replies: [] });
    expect(await countInquiries("new")).toBe(1);
  });

  it("lists newest first and filters by status", async () => {
    const first = await createInquiry(values);
    await createInquiry({ ...values, name: "Bob" });
    await setInquiryStatus(first, "archived");
    expect((await listInquiries()).map((item) => item.name)).toEqual(["Bob", "Ada"]);
    expect((await listInquiries("archived")).map((item) => item.name)).toEqual(["Ada"]);
  });

  it("records replies and marks as replied only when delivered", async () => {
    const id = await createInquiry(values);
    await addReply(id, { subject: "Hi", body: "Thanks", delivered: false });
    expect((await getInquiry(id))?.status).toBe("new");
    await addReply(id, { subject: "Hi", body: "Thanks", delivered: true });
    const inquiry = await getInquiry(id);
    expect(inquiry?.status).toBe("replied");
    expect(inquiry?.replies).toHaveLength(2);
  });

  it("flags email failures", async () => {
    const id = await createInquiry(values);
    await markEmailFailed(id);
    expect((await getInquiry(id))?.emailFailed).toBe(true);
  });
});
```

- [ ] **Step 8: Run** `npm test -- src/lib/db/inquiries.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 9: Create `src/lib/db/inquiries.ts`**

```ts
import type { ObjectId } from "mongodb";
import { collections, getDb } from "@/lib/db/client";
import { toObjectId } from "@/lib/db/ordered-repo";
import type { InquiryStatus } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";

type ReplyDoc = { subject: string; body: string; sentAt: Date; delivered: boolean };
type InquiryDoc = InquiryValues & {
  _id?: ObjectId;
  status: InquiryStatus;
  emailFailed: boolean;
  replies: ReplyDoc[];
  createdAt: Date;
};

export type InquiryReply = Omit<ReplyDoc, "sentAt"> & { sentAt: string };
export type Inquiry = InquiryValues & {
  id: string;
  status: InquiryStatus;
  emailFailed: boolean;
  replies: InquiryReply[];
  createdAt: string;
};

async function collection() {
  return (await getDb()).collection<InquiryDoc>(collections.inquiries);
}

function toInquiry(doc: InquiryDoc & { _id: ObjectId }): Inquiry {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    services: doc.services,
    businessDetails: doc.businessDetails,
    status: doc.status,
    emailFailed: doc.emailFailed,
    replies: doc.replies.map((reply) => ({ ...reply, sentAt: reply.sentAt.toISOString() })),
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createInquiry(values: InquiryValues) {
  const result = await (await collection()).insertOne({
    ...values,
    status: "new",
    emailFailed: false,
    replies: [],
    createdAt: new Date(),
  });
  return String(result.insertedId);
}

export async function listInquiries(status?: InquiryStatus) {
  const docs = await (await collection()).find(status ? { status } : {}).sort({ createdAt: -1, _id: -1 }).toArray();
  return docs.map(toInquiry);
}

export async function getInquiry(id: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOne({ _id });
  return doc ? toInquiry(doc) : null;
}

export async function countInquiries(status?: InquiryStatus) {
  return (await collection()).countDocuments(status ? { status } : {});
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const _id = toObjectId(id);
  if (!_id) return false;
  return (await (await collection()).updateOne({ _id }, { $set: { status } })).matchedCount === 1;
}

export async function markEmailFailed(id: string) {
  const _id = toObjectId(id);
  if (_id) await (await collection()).updateOne({ _id }, { $set: { emailFailed: true } });
}

export async function addReply(id: string, reply: { subject: string; body: string; delivered: boolean }) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const result = await (await collection()).updateOne(
    { _id },
    {
      $push: { replies: { ...reply, sentAt: new Date() } },
      ...(reply.delivered && { $set: { status: "replied" as const } }),
    },
  );
  return result.matchedCount === 1;
}
```

Note: this imports `InquiryValues` from `@/lib/inquiry`, which gains an `email` field in Task 6. So this task compiles on its own, make three small edits to `src/lib/inquiry.ts` now (Task 6 adds validation and UI):
1. `InquiryValues` gets `email: string;` after `name`.
2. `emptyInquiry` gets `email: ""`.
3. `normalizeInquiry` returns `email: text(input.email).toLowerCase(),` after `name`.

- [ ] **Step 10: Run** `npm test -- src/lib/db/inquiries.test.ts` — Expected: 4 passed.

- [ ] **Step 11: Write the failing test `src/lib/db/admins.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { findAdminByEmail, findAdminById, updatePassword, upsertAdmin } from "@/lib/db/admins";
import { setupTestDb } from "@/test/mongo";

setupTestDb();

describe("admins repository", () => {
  it("creates an admin with a lowercased email", async () => {
    const admin = await upsertAdmin("Me@Example.com", "hash1");
    expect(admin.email).toBe("me@example.com");
    expect((await findAdminByEmail("ME@example.com"))?.id).toBe(admin.id);
  });

  it("upsert resets the password and bumps sessionVersion", async () => {
    const first = await upsertAdmin("me@example.com", "hash1");
    const second = await upsertAdmin("me@example.com", "hash2");
    expect(second.id).toBe(first.id);
    expect(second.passwordHash).toBe("hash2");
    expect(second.sessionVersion).toBe(first.sessionVersion + 1);
  });

  it("updatePassword returns the new sessionVersion", async () => {
    const admin = await upsertAdmin("me@example.com", "hash1");
    expect(await updatePassword(admin.id, "hash2")).toBe(admin.sessionVersion + 1);
    expect((await findAdminById(admin.id))?.passwordHash).toBe("hash2");
    expect(await findAdminById("bad")).toBeNull();
  });
});
```

- [ ] **Step 12: Run** `npm test -- src/lib/db/admins.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 13: Create `src/lib/db/admins.ts`**

```ts
import type { ObjectId } from "mongodb";
import { collections, getDb } from "@/lib/db/client";
import { toObjectId } from "@/lib/db/ordered-repo";

type AdminDoc = { _id?: ObjectId; email: string; passwordHash: string; sessionVersion: number };
export type Admin = { id: string; email: string; passwordHash: string; sessionVersion: number };

async function collection() {
  return (await getDb()).collection<AdminDoc>(collections.admins);
}

function toAdmin(doc: AdminDoc & { _id: ObjectId }): Admin {
  return { id: String(doc._id), email: doc.email, passwordHash: doc.passwordHash, sessionVersion: doc.sessionVersion };
}

export async function findAdminByEmail(email: string) {
  const doc = await (await collection()).findOne({ email: email.trim().toLowerCase() });
  return doc ? toAdmin(doc) : null;
}

export async function findAdminById(id: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOne({ _id });
  return doc ? toAdmin(doc) : null;
}

/** Creates the admin, or resets the password of an existing one (signing out all sessions). */
export async function upsertAdmin(email: string, passwordHash: string) {
  const doc = await (await collection()).findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    { upsert: true, returnDocument: "after" },
  );
  if (!doc) throw new Error("Failed to save admin.");
  return toAdmin(doc);
}

export async function updatePassword(id: string, passwordHash: string) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const doc = await (await collection()).findOneAndUpdate(
    { _id },
    { $set: { passwordHash }, $inc: { sessionVersion: 1 } },
    { returnDocument: "after" },
  );
  return doc ? doc.sessionVersion : null;
}
```

- [ ] **Step 14: Run** `npm test` — Expected: all tests pass. Run `npm run typecheck` — Expected: no errors.

- [ ] **Step 15: Commit**

```bash
git add src/lib/db src/lib/inquiry.ts
git commit -m "feat(db): repositories for content, settings, inquiries and admins

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Seed and create-admin scripts

**Files:**
- Move: `src/content/{projects,services,experience,stack,testimonials,site}.ts` → `scripts/seed-data/`
- Create: `scripts/seed.ts`, `scripts/seed-core.ts`, `scripts/seed-core.test.ts`, `scripts/create-admin.ts`, `src/lib/site-constants.ts`, `src/lib/object.ts`
- Modify: `src/lib/auth/password.ts` (create here — used by create-admin)

**Interfaces:**
- Consumes: `repos`, `saveSettings`, `findSettings`, `upsertAdmin`, `ensureIndexes`, `closeDb`, schemas.
- Produces: `seedDatabase(): Promise<Record<string, "seeded" | "skipped">>`; `hashPassword(password): Promise<string>`, `verifyPassword(password, hash): Promise<boolean>`; `navigation`, `availabilityLabels`, `socialLabels` from `@/lib/site-constants`; `omit(value, ...keys)` from `@/lib/object`.

- [ ] **Step 1: Move the content files** (keeps git history)

```bash
mkdir -p scripts/seed-data
git mv src/content/projects.ts scripts/seed-data/projects.ts
git mv src/content/services.ts scripts/seed-data/services.ts
git mv src/content/experience.ts scripts/seed-data/experience.ts
git mv src/content/stack.ts scripts/seed-data/stack.ts
git mv src/content/testimonials.ts scripts/seed-data/testimonials.ts
git mv src/content/site.ts scripts/seed-data/site.ts
```

The app will not compile until Task 4 rewires the imports; that is expected. Do not run `next build` until Task 4.

- [ ] **Step 2: Create `src/lib/site-constants.ts`** (structure that stays in code, copied from the old `site.ts`)

```ts
import type { SiteConfig } from "@/types/site";

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
] as const;

export const availabilityLabels = {
  available: { short: "Available", long: "Available for freelance" },
  limited: { short: "Limited", long: "Limited availability" },
  unavailable: { short: "Booked", long: "Currently booked" },
} as const;

export const socialLabels: Record<keyof SiteConfig["social"], string> = {
  github: "GitHub",
  fiverr: "Fiverr",
  upwork: "Upwork",
};
```

Then in `scripts/seed-data/site.ts` delete the `navigation`, `availabilityLabels` and `socialLabels` exports (they now live in `site-constants.ts`).

- [ ] **Step 2b: Create `src/lib/object.ts`** (shared by the seed and the content mappers in Task 4)

```ts
/** Shallow copy of `value` without `keys`. */
export function omit<T extends object, K extends keyof T>(value: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete (copy as Partial<T>)[key];
  return copy;
}
```

- [ ] **Step 3: Create `src/lib/auth/password.ts`**

```ts
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 4: Write the failing test `scripts/seed-core.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { repos } from "@/lib/db/repos";
import { findSettings } from "@/lib/db/settings";
import { setupTestDb } from "@/test/mongo";
import { seedDatabase } from "./seed-core";

setupTestDb();

describe("seedDatabase", () => {
  it("imports the current content once and skips non-empty collections after", async () => {
    const first = await seedDatabase();
    expect(Object.values(first).every((state) => state === "seeded")).toBe(true);
    expect(await repos.projects.count()).toBe(3);
    expect(await repos.services.count()).toBe(6);
    expect((await findSettings())?.brand).toBe("AnbuDev");

    const second = await seedDatabase();
    expect(Object.values(second).every((state) => state === "skipped")).toBe(true);
    expect(await repos.projects.count()).toBe(3);
  });
});
```

- [ ] **Step 5: Run** `npm test -- scripts/seed-core.test.ts` — Expected: FAIL, cannot resolve `./seed-core`.

- [ ] **Step 6: Create `scripts/seed-core.ts`**

```ts
import type { z } from "zod";
import { repos } from "@/lib/db/repos";
import {
  experienceSchema,
  processStepSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  stackGroupSchema,
  testimonialSchema,
} from "@/lib/db/schemas";
import { findSettings, saveSettings } from "@/lib/db/settings";
import type { OrderedRepo } from "@/lib/db/ordered-repo";
import { omit } from "@/lib/object";
import { experience } from "./seed-data/experience";
import { projects } from "./seed-data/projects";
import { services, workProcess } from "./seed-data/services";
import { about, hero, siteConfig } from "./seed-data/site";
import { stack } from "./seed-data/stack";
import { testimonials } from "./seed-data/testimonials";

// The service options previously hard-coded in src/lib/inquiry.ts.
const inquiryServices = ["Website Development", "E-commerce", "Custom Software", "AI / Automation", "Mobile App", "UI/UX Design", "SEO"];

async function seedCollection<S extends z.ZodType<object>>(repo: OrderedRepo<z.infer<S>>, schema: S, items: unknown[]) {
  if ((await repo.count()) > 0) return "skipped" as const;
  for (const item of items) await repo.create(schema.parse(item));
  return "seeded" as const;
}

/** Copies the original src/content data into MongoDB. Collections that already hold data are left alone. */
export async function seedDatabase() {
  const report: Record<string, "seeded" | "skipped"> = {};

  if (await findSettings()) {
    report.settings = "skipped";
  } else {
    await saveSettings(
      settingsSchema.parse({
        ...omit(siteConfig, "url", "portrait"),
        resumeUrl: siteConfig.resumeUrl ?? "",
        hero,
        about,
        inquiryServices,
        autoReplyMessage:
          "Thanks for reaching out! I've received your project request and will get back to you within 1–2 business days.",
      }),
    );
    report.settings = "seeded";
  }

  report.projects = await seedCollection(
    repos.projects,
    projectSchema,
    projects.map((project) => ({
      ...omit(project, "number", "image", "imageAlt"),
      features: project.features ?? [],
      metrics: project.metrics ?? [],
    })),
  );
  report.services = await seedCollection(repos.services, serviceSchema, services.map((service) => omit(service, "number")));
  report.processSteps = await seedCollection(repos.processSteps, processStepSchema, workProcess.map((step) => omit(step, "number")));
  report.experience = await seedCollection(repos.experience, experienceSchema, experience);
  report.stackGroups = await seedCollection(repos.stackGroups, stackGroupSchema, stack);
  report.testimonials = await seedCollection(
    repos.testimonials,
    testimonialSchema,
    testimonials.map((testimonial) => ({ ...omit(testimonial, "avatar"), published: true })),
  );

  return report;
}
```

- [ ] **Step 7: Run** `npm test -- scripts/seed-core.test.ts` — Expected: PASS.

- [ ] **Step 8: Create `scripts/seed.ts`**

```ts
import { closeDb, ensureIndexes } from "@/lib/db/client";
import { seedDatabase } from "./seed-core";

async function main() {
  await ensureIndexes();
  const report = await seedDatabase();
  for (const [collection, state] of Object.entries(report)) console.log(`${collection.padEnd(14)} ${state}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
```

- [ ] **Step 9: Create `scripts/create-admin.ts`**

```ts
import { hashPassword } from "@/lib/auth/password";
import { upsertAdmin } from "@/lib/db/admins";
import { closeDb, ensureIndexes } from "@/lib/db/client";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !email.includes("@")) throw new Error("Set ADMIN_EMAIL in .env.local.");
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD (at least 12 characters) in .env.local.");

  await ensureIndexes();
  const admin = await upsertAdmin(email, await hashPassword(password));
  console.log(`Admin ready: ${admin.email}. Existing sessions were signed out.`);
  console.log("You can now remove ADMIN_PASSWORD from .env.local.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closeDb);
```

- [ ] **Step 10: Commit**

```bash
git add -A scripts src/lib/site-constants.ts src/lib/object.ts src/lib/auth/password.ts src/content
git commit -m "feat(db): seed and create-admin scripts; move content to seed data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Public content layer and route-group restructure

The public site stops importing `src/content` and reads from MongoDB through a cached layer. Public pages move into an `app/(site)` route group (URLs unchanged) so `/admin` can have its own chrome.

**Files:**
- Create: `src/lib/content.ts`, `src/lib/projects.test.ts`, `src/components/layout/site-chrome.tsx`, `src/components/layout/not-found-content.tsx`, `src/app/(site)/layout.tsx`, `src/app/(site)/not-found.tsx`
- Move: `src/app/page.tsx`, `src/app/about/`, `src/app/services/`, `src/app/work/` → `src/app/(site)/`
- Modify: `src/types/site.ts`, `src/lib/projects.ts`, `src/lib/seo.ts`, `src/app/layout.tsx`, `src/app/not-found.tsx`, `src/app/opengraph-image.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, all `(site)` pages, `src/components/layout/{site-nav,topbar,footer}.tsx`, `src/components/ui/{availability,social-links}.tsx`, `src/components/home/profile-card.tsx`, `src/components/about/about-card.tsx`, `src/components/contact/cta-card.tsx`, `src/components/testimonials/reviews.tsx`, `src/components/inquiry/{inquiry-provider,inquiry-dialog}.tsx`

**Interfaces:**
- Consumes: `repos`, `findSettings`, `Stored`, schema types, `omit`, `site-constants`.
- Produces (`@/lib/content`): `contentTags`, `type ContentTag = "settings" | "projects" | "services" | "process" | "experience" | "stack" | "testimonials"`, `getSettings(): Promise<Settings>`, `getSiteConfig(): Promise<SiteConfig>`, `toSiteConfig(settings): SiteConfig`, `getProjects(): Promise<Project[]>`, `getServices(): Promise<Service[]>`, `getProcessSteps(): Promise<ProcessStep[]>`, `getExperience(): Promise<Experience[]>`, `getStack(): Promise<StackGroup[]>`, `getTestimonials(): Promise<Testimonial[]>` (published only).
- Produces (`@/lib/projects`, now async): `getCaseStudyProjects()`, `getProject(slug)`, `getFeaturedProjects()`, `getNextProject(slug)`; sync `linksToLiveSite`, `getProjectHref` unchanged.
- Produces (`@/lib/seo`): `siteUrl`, `absoluteUrl(path)`, `defaultTitle(site)`, `createMetadata(site, input)`, `homeJsonLd(site, services)`, `projectJsonLd(site, project)`.
- Produces: `type NavSite = Pick<SiteConfig, "brand" | "name" | "email" | "resumeUrl" | "availability">`; `<Availability status long? className? />`; `<InquiryProvider services contactEmail>`; `<InquiryDialog open onClose services contactEmail>`.

- [ ] **Step 1: Update `src/types/site.ts`** — add `portraitAlt` and `NavSite`

```ts
export type Availability = "available" | "limited" | "unavailable";

export type SiteConfig = {
  brand: string;
  name: string;
  title: string;
  description: string;
  role: string;
  focus: string;
  location: string;
  availability: Availability;
  email: string;
  url: string;
  year: string;
  /** ImageKit URL. Without one, an initials monogram is shown. */
  portrait?: string;
  portraitAlt?: string;
  resumeUrl?: string;
  social: {
    github?: string;
    fiverr?: string;
    upwork?: string;
  };
  builtWith: string;
  openTo: string;
};

/** The slice of the site config the client-side navigation needs. */
export type NavSite = Pick<SiteConfig, "brand" | "name" | "email" | "resumeUrl" | "availability">;
```

- [ ] **Step 2: Create `src/lib/content.ts`**

```ts
import { unstable_cache } from "next/cache";
import { pad } from "@/lib/cn";
import type { Stored } from "@/lib/db/ordered-repo";
import { repos } from "@/lib/db/repos";
import type { ProjectInput, Settings } from "@/lib/db/schemas";
import { findSettings } from "@/lib/db/settings";
import { omit } from "@/lib/object";
import type { Experience, ProcessStep, Service, StackGroup, Testimonial } from "@/types/content";
import type { Project } from "@/types/project";
import type { SiteConfig } from "@/types/site";

/** Public reads are cached under these tags; admin saves expire the matching tag (see lib/admin/refresh.ts). */
export const contentTags = ["settings", "projects", "services", "process", "experience", "stack", "testimonials"] as const;
export type ContentTag = (typeof contentTags)[number];

function cached<T>(tag: ContentTag, load: () => Promise<T>) {
  return unstable_cache(load, [`content:${tag}`], { tags: [tag] });
}

const meta = ["id", "sortOrder", "createdAt", "updatedAt"] as const;

export const getSettings = cached("settings", async () => {
  const settings = await findSettings();
  if (!settings) throw new Error("Site settings are missing. Run `npm run db:seed`.");
  return settings;
});

export function toSiteConfig(settings: Settings): SiteConfig {
  return {
    brand: settings.brand,
    name: settings.name,
    title: settings.title,
    description: settings.description,
    role: settings.role,
    focus: settings.focus,
    location: settings.location,
    availability: settings.availability,
    email: settings.email,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vecna.dev",
    year: settings.year,
    portrait: settings.portrait?.url,
    portraitAlt: settings.portrait?.alt || undefined,
    resumeUrl: settings.resumeUrl,
    social: settings.social,
    builtWith: settings.builtWith,
    openTo: settings.openTo,
  };
}

export async function getSiteConfig() {
  return toSiteConfig(await getSettings());
}

export function toProject(stored: Stored<ProjectInput>, index: number): Project {
  return {
    ...omit(stored, ...meta, "image"),
    number: pad(index + 1),
    image: stored.image?.url,
    imageAlt: stored.image?.alt || undefined,
  };
}

export const getProjects = cached("projects", async () => (await repos.projects.list()).map(toProject));

export const getServices = cached("services", async (): Promise<Service[]> =>
  (await repos.services.list()).map((service, index) => ({ ...omit(service, ...meta), number: pad(index + 1) })),
);

export const getProcessSteps = cached("process", async (): Promise<ProcessStep[]> =>
  (await repos.processSteps.list()).map((step, index) => ({ ...omit(step, ...meta), number: pad(index + 1) })),
);

export const getExperience = cached("experience", async (): Promise<Experience[]> =>
  (await repos.experience.list()).map((item) => omit(item, ...meta)),
);

export const getStack = cached("stack", async (): Promise<StackGroup[]> =>
  (await repos.stackGroups.list()).map((group) => omit(group, ...meta)),
);

export const getTestimonials = cached("testimonials", async (): Promise<Testimonial[]> =>
  (await repos.testimonials.list({ published: true })).map((item) => ({
    ...omit(item, ...meta, "avatar", "published"),
    avatar: item.avatar?.url,
  })),
);
```

- [ ] **Step 3: Write the failing test `src/lib/projects.test.ts`** (Review Focus 1)

```ts
import { describe, expect, it, vi } from "vitest";
import { repos } from "@/lib/db/repos";
import { setupTestDb } from "@/test/mongo";

// Outside Next there is no incremental cache; call the loaders directly.
vi.mock("next/cache", () => ({ unstable_cache: <T>(load: T) => load }));

const { getCaseStudyProjects, getNextProject, getProject } = await import("@/lib/projects");

setupTestDb();

const base = { description: "d", year: "2026", technologies: ["React"], featured: true, features: [], metrics: [] };

describe("project helpers", () => {
  it("returns undefined for an unknown or deleted slug", async () => {
    const id = await repos.projects.create({ ...base, slug: "gone", title: "Gone", category: ["Case study"] });
    await repos.projects.remove(id);
    expect(await getProject("gone")).toBeUndefined();
  });

  it("excludes web applications with a live URL from case studies", async () => {
    await repos.projects.create({ ...base, slug: "app", title: "App", category: ["Web application"], liveUrl: "https://app.example" });
    await repos.projects.create({ ...base, slug: "study", title: "Study", category: ["Branding"] });
    expect((await getCaseStudyProjects()).map((project) => project.slug)).toEqual(["study"]);
    expect(await getProject("app")).toBeUndefined();
  });

  it("numbers projects by position and wraps the next project", async () => {
    await repos.projects.create({ ...base, slug: "a", title: "A", category: ["X"] });
    await repos.projects.create({ ...base, slug: "b", title: "B", category: ["X"] });
    expect((await getProject("b"))?.number).toBe("02");
    expect((await getNextProject("b"))?.slug).toBe("a");
  });
});
```

- [ ] **Step 4: Run** `npm test -- src/lib/projects.test.ts` — Expected: FAIL (`getCaseStudyProjects` is not exported).

- [ ] **Step 5: Replace `src/lib/projects.ts`**

```ts
import { getProjects } from "@/lib/content";
import type { Project } from "@/types/project";

/** Web applications skip the case study and link straight to the live site. */
export function linksToLiveSite(project: Project): project is Project & { liveUrl: string } {
  return project.category.includes("Web application") && Boolean(project.liveUrl);
}

export function getProjectHref(project: Project) {
  return linksToLiveSite(project) ? project.liveUrl : `/work/${project.slug}`;
}

/** Projects that get their own /work/[slug] page. */
export async function getCaseStudyProjects() {
  return (await getProjects()).filter((project) => !linksToLiveSite(project));
}

export async function getProject(slug: string) {
  return (await getCaseStudyProjects()).find((project) => project.slug === slug);
}

export async function getFeaturedProjects() {
  return (await getProjects()).filter((project) => project.featured);
}

export async function getNextProject(slug: string) {
  const caseStudies = await getCaseStudyProjects();
  if (caseStudies.length < 2) return undefined;
  const index = caseStudies.findIndex((project) => project.slug === slug);
  return caseStudies[(index + 1) % caseStudies.length];
}
```

- [ ] **Step 6: Run** `npm test -- src/lib/projects.test.ts` — Expected: 3 passed.

- [ ] **Step 7: Replace `src/lib/seo.ts`**

```ts
import type { Metadata } from "next";
import type { Service } from "@/types/content";
import type { Project } from "@/types/project";
import type { SiteConfig } from "@/types/site";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vecna.dev";

export function defaultTitle(site: SiteConfig) {
  return `${site.brand} — ${site.title}`;
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

type MetadataInput = {
  /** Omit on the home page to use the default title. */
  title?: string;
  description?: string;
  path: string;
};

export function createMetadata(site: SiteConfig, { title, description = site.description, path }: MetadataInput): Metadata {
  const fullTitle = title ? `${title} — ${site.brand}` : defaultTitle(site);
  // A page-level `openGraph` object replaces the inherited one, dropping the file-based image,
  // so the root OG image is referenced explicitly.
  const ogImage = { url: "/opengraph-image", width: 1200, height: 630, alt: defaultTitle(site) };

  return {
    title: { absolute: site.brand },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.brand,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}

function person(site: SiteConfig) {
  return {
    "@type": "Person",
    "@id": absoluteUrl("/#person"),
    name: site.name,
    jobTitle: site.title,
    url: site.url,
    email: `mailto:${site.email}`,
    sameAs: Object.values(site.social).filter(Boolean),
  };
}

export function homeJsonLd(site: SiteConfig, services: Service[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(site),
      {
        "@type": "ProfessionalService",
        "@id": absoluteUrl("/#service"),
        name: site.brand,
        url: site.url,
        description: site.description,
        email: site.email,
        founder: { "@id": absoluteUrl("/#person") },
        serviceType: services.map((service) => service.title),
      },
    ],
  };
}

export function projectJsonLd(site: SiteConfig, project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: absoluteUrl(`/work/${project.slug}`),
    dateCreated: project.year,
    keywords: project.technologies.join(", "),
    creator: person(site),
    // Images are absolute ImageKit URLs now.
    ...(project.image && { image: project.image }),
  };
}
```

- [ ] **Step 8: Move the public routes into the route group**

```bash
mkdir -p "src/app/(site)"
git mv src/app/page.tsx "src/app/(site)/page.tsx"
git mv src/app/about "src/app/(site)/about"
git mv src/app/services "src/app/(site)/services"
git mv src/app/work "src/app/(site)/work"
```

- [ ] **Step 9: Replace `src/components/ui/availability.tsx`**

```tsx
import { cn } from "@/lib/cn";
import { availabilityLabels } from "@/lib/site-constants";
import type { Availability as AvailabilityStatus } from "@/types/site";

export function Availability({ status, long = false, className }: { status: AvailabilityStatus; long?: boolean; className?: string }) {
  const labels = availabilityLabels[status];

  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      {long ? labels.long : labels.short}
      <span
        aria-hidden="true"
        className={cn("size-2.5 shrink-0 rounded-full border-2 border-current", status === "available" ? "bg-current" : "bg-transparent")}
      />
    </span>
  );
}
```

- [ ] **Step 10: Update `src/components/ui/social-links.tsx`** — async, reads the config

Replace `import { siteConfig, socialLabels } from "@/content/site";` with:

```ts
import { getSiteConfig } from "@/lib/content";
import { socialLabels } from "@/lib/site-constants";
```

and the start of the component with:

```tsx
export async function SocialLinks({ className }: { className?: string }) {
  const siteConfig = await getSiteConfig();
  const socials = (Object.entries(siteConfig.social) as [SocialKey, string | undefined][]).filter(
```

(rest unchanged).

- [ ] **Step 11: Replace `src/components/layout/footer.tsx`**

```tsx
import { getSiteConfig } from "@/lib/content";

export async function Footer() {
  const site = await getSiteConfig();

  return (
    <footer className="meta flex flex-col gap-2 border-t-2 border-ink px-4 py-5 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
      <p>
        © {site.year} {site.name} · {site.brand}
      </p>
      <p>Built with {site.builtWith}</p>
    </footer>
  );
}
```

- [ ] **Step 12: Update `src/components/layout/site-nav.tsx`** (client component — data arrives as props)

1. Replace `import { navigation, siteConfig } from "@/content/site";` with:
   ```ts
   import { navigation } from "@/lib/site-constants";
   import type { NavSite } from "@/types/site";
   ```
2. `function Logo({ brand, onClick }: { brand: string; onClick?: () => void }) {` and render `{brand}` instead of `{siteConfig.brand}`.
3. `export function SiteNav({ site }: { site: NavSite }) {`
4. Replace every remaining `siteConfig.` with `site.`; `<Logo />` → `<Logo brand={site.brand} />`, `<Logo onClick={close} />` → `<Logo brand={site.brand} onClick={close} />`; both `<Availability long />` → `<Availability status={site.availability} long />`.

- [ ] **Step 13: Update `src/components/layout/topbar.tsx`** the same way

1. Replace the `@/content/site` import with `import { navigation } from "@/lib/site-constants";` and `import type { NavSite } from "@/types/site";`
2. `export function Topbar({ site }: { site: NavSite }) {`
3. Replace `siteConfig.` with `site.`; `<Availability long />` → `<Availability status={site.availability} long />`.

- [ ] **Step 14: Inquiry provider and dialog take data as props**

`src/components/inquiry/inquiry-provider.tsx`:

```tsx
export function InquiryProvider({ children, services, contactEmail }: { children: ReactNode; services: string[]; contactEmail: string }) {
```

and render `<InquiryDialog open={open} onClose={() => setOpen(false)} services={services} contactEmail={contactEmail} />`.

`src/components/inquiry/inquiry-dialog.tsx`:
- Delete `import { siteConfig } from "@/content/site";` and remove `inquiryServices,` from the `@/lib/inquiry` import.
- `export function InquiryDialog({ open, onClose, services, contactEmail }: { open: boolean; onClose: () => void; services: string[]; contactEmail: string }) {`
- `{inquiryServices.map((service, index) => (` → `{services.map((service, index) => (`
- Both `siteConfig.email` → `contactEmail`.

- [ ] **Step 15: Create `src/components/layout/site-chrome.tsx`** (the body of the old `app/layout.tsx`)

```tsx
import type { ReactNode } from "react";
import { InquiryProvider } from "@/components/inquiry/inquiry-provider";
import { Footer } from "@/components/layout/footer";
import { SiteNav } from "@/components/layout/site-nav";
import { Topbar } from "@/components/layout/topbar";
import { ContextCursor } from "@/components/ui/context-cursor";
import { RevealObserver } from "@/components/ui/reveal-observer";
import { getSettings } from "@/lib/content";
import type { NavSite } from "@/types/site";

/** Public site frame: sidebar, canvas, top bar, footer and the inquiry modal. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const site: NavSite = {
    brand: settings.brand,
    name: settings.name,
    email: settings.email,
    resumeUrl: settings.resumeUrl,
    availability: settings.availability,
  };

  return (
    <InquiryProvider services={settings.inquiryServices} contactEmail={settings.email}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_minmax(0,1fr)]">
        <SiteNav site={site} />
        <div id="page" className="px-2 pb-2 sm:px-4 sm:pb-4 lg:py-6 lg:pl-0 lg:pr-6">
          <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col border-2 border-ink bg-paper lg:min-h-[calc(100dvh-3rem)]">
            <Topbar site={site} />
            <main id="main-content" tabIndex={-1} className="flex-1 px-4 pb-14 pt-8 sm:px-6 lg:px-10 lg:pt-10">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </div>
      <RevealObserver />
      <ContextCursor />
    </InquiryProvider>
  );
}
```

- [ ] **Step 16: Create `src/app/(site)/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/layout/site-chrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
```

- [ ] **Step 17: Replace `src/app/layout.tsx`** (html, fonts and site-wide metadata only)

```tsx
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { getSiteConfig } from "@/lib/content";
import { defaultTitle, siteUrl } from "@/lib/seo";
import "./globals.css";

// Variable Bricolage: the opsz axis keeps body text calm and lets headings get characterful; wdth drives the condensed display cut.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});

const code = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();

  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: site.brand },
    description: site.description,
    applicationName: site.brand,
    authors: [{ name: site.name, url: site.url }],
    creator: site.name,
    openGraph: {
      type: "website",
      siteName: site.brand,
      locale: "en_US",
      url: "/",
      title: defaultTitle(site),
      description: site.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#1c1c1e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 18: Not-found pages**

`src/components/layout/not-found-content.tsx`:

```tsx
import { House } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";

export function NotFoundContent() {
  return (
    <>
      <PageTitle eyebrow="(404)">Page not found</PageTitle>
      <Card tone="tint" className="mt-8 max-w-2xl p-6 sm:p-8">
        <p className="text-lead">This page doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/" icon={<House />}>
            Back home
          </ButtonLink>
          <ButtonLink href="/work" variant="secondary">
            View work
          </ButtonLink>
        </div>
      </Card>
    </>
  );
}
```

`src/app/(site)/not-found.tsx` (for `notFound()` inside public pages — already inside the chrome):

```tsx
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return <NotFoundContent />;
}
```

`src/app/not-found.tsx` (unmatched URLs render in the bare root layout, so it adds the chrome):

```tsx
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteChrome } from "@/components/layout/site-chrome";

export const metadata: Metadata = { robots: { index: false } };

export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
```

- [ ] **Step 19: Update the content components**

`src/components/contact/cta-card.tsx`: replace the `@/content/site` import with `import { getSiteConfig } from "@/lib/content";`, make it `export async function CtaCard() {` with `const siteConfig = await getSiteConfig();` as the first line, and change `<Availability long />` to `<Availability status={siteConfig.availability} long />`.

`src/components/about/about-card.tsx`:
- Replace `import { about, siteConfig } from "@/content/site";` with `import { getSettings, toSiteConfig } from "@/lib/content";` and add `import type { SiteConfig } from "@/types/site";`
- `export async function AboutCard({ className }: { className?: string }) {` with first lines:
  ```ts
  const settings = await getSettings();
  const siteConfig = toSiteConfig(settings);
  const about = settings.about;
  ```
- `<Availability long />` → `<Availability status={siteConfig.availability} long />`
- `<Avatar />` → `<Avatar siteConfig={siteConfig} />`; `function Avatar({ siteConfig }: { siteConfig: SiteConfig }) {`; image `alt={siteConfig.portraitAlt ?? "Portrait of " + siteConfig.name}`.

`src/components/home/profile-card.tsx`:
- Replace the four `@/content/*` imports with:
  ```ts
  import { getProjects, getServices, getSettings, getStack, toSiteConfig } from "@/lib/content";
  import { availabilityLabels } from "@/lib/site-constants";
  import type { SiteConfig } from "@/types/site";
  ```
- `export async function ProfileCard({ className }: { className?: string }) {` with first lines:
  ```ts
  const [settings, projects, services, stack] = await Promise.all([getSettings(), getProjects(), getServices(), getStack()]);
  const siteConfig = toSiteConfig(settings);
  const about = settings.about;
  ```
- `<Portrait />` → `<Portrait siteConfig={siteConfig} />`; `function Portrait({ siteConfig }: { siteConfig: SiteConfig }) {`; image `alt={siteConfig.portraitAlt ?? "Portrait of " + siteConfig.name}`.

`src/components/testimonials/reviews.tsx`:
- Replace `import { testimonials } from "@/content/testimonials";` with `import { getTestimonials } from "@/lib/content";`
- ```tsx
  export async function Reviews() {
    const testimonials = await getTestimonials();
    if (testimonials.length === 0) return null;
  ```
- `lead={<FeedbackPanel average={average} count={testimonials.length} />}`
- `function FeedbackPanel({ average, count }: { average: string | null; count: number }) {` and replace both `testimonials.length` inside it with `count`.

- [ ] **Step 20: Update the pages**

`src/app/(site)/page.tsx` — header and the start of the component (the JSX below `<JsonLd …/>` is unchanged):

```tsx
import { FolderCode } from "lucide-react";
import type { Metadata } from "next";
import { CtaCard } from "@/components/contact/cta-card";
import { ProfileCard } from "@/components/home/profile-card";
import { Reviews } from "@/components/testimonials/reviews";
import { ButtonLink } from "@/components/ui/button-link";
import { JsonLd } from "@/components/ui/json-ld";
import { ListCard } from "@/components/ui/list-card";
import { PageTitle } from "@/components/ui/page-title";
import { getServices, getSiteConfig } from "@/lib/content";
import { splitClass, splitColumnClass } from "@/lib/grid";
import { getFeaturedProjects, getProjectHref, linksToLiveSite } from "@/lib/projects";
import { createMetadata, homeJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return createMetadata(await getSiteConfig(), { path: "/" });
}

export default async function HomePage() {
  const [siteConfig, services, featured] = await Promise.all([getSiteConfig(), getServices(), getFeaturedProjects()]);

  return (
    <>
      <JsonLd data={homeJsonLd(siteConfig, services)} />
```

`src/app/(site)/about/page.tsx`: replace the three `@/content/*` imports with `import { getExperience, getSiteConfig, getStack } from "@/lib/content";` plus `import type { Metadata } from "next";`, then:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return createMetadata(siteConfig, {
    title: "About",
    description: `${siteConfig.role} focused on web, product UI, and AI. Based in ${siteConfig.location}.`,
    path: "/about",
  });
}

export default async function AboutPage() {
  const [experience, stack] = await Promise.all([getExperience(), getStack()]);
```

`src/app/(site)/services/page.tsx`: replace `import { services, workProcess } from "@/content/services";` with `import { getProcessSteps, getServices, getSiteConfig } from "@/lib/content";` plus `import type { Metadata } from "next";`, then:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  return createMetadata(await getSiteConfig(), {
    title: "Services",
    description: "Web applications, e-commerce, product UI, AI integration, SaaS development, and SEO & performance — from first idea to production.",
    path: "/services",
  });
}

export default async function ServicesPage() {
  const [services, workProcess] = await Promise.all([getServices(), getProcessSteps()]);
```

`src/app/(site)/work/page.tsx`: replace `import { projects } from "@/lib/projects";` with `import { getProjects, getSiteConfig } from "@/lib/content";` plus `import type { Metadata } from "next";`, then:

```tsx
export async function generateMetadata(): Promise<Metadata> {
  return createMetadata(await getSiteConfig(), {
    title: "Work",
    description: "Selected projects across web applications, product UI, and AI.",
    path: "/work",
  });
}

export default async function WorkPage() {
  const projects = await getProjects();
```

`src/app/(site)/work/[slug]/page.tsx`:
- `import { caseStudyProjects, getNextProject, getProject } from "@/lib/projects";` → `import { getCaseStudyProjects, getNextProject, getProject } from "@/lib/projects";` and add `import { getSiteConfig } from "@/lib/content";`
- Delete `export const dynamicParams = false;` (new projects render on demand; unknown slugs still reach `notFound()`).
- ```tsx
  export async function generateStaticParams() {
    return (await getCaseStudyProjects()).map((project) => ({ slug: project.slug }));
  }

  export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const [site, project] = await Promise.all([getSiteConfig(), getProject(slug)]);
    if (!project) return {};
    return createMetadata(site, { title: project.title, description: project.description, path: `/work/${slug}` });
  }
  ```
- Page body: `const project = await getProject(slug);`, `const next = await getNextProject(slug);`, add `const site = await getSiteConfig();`, and `<JsonLd data={projectJsonLd(site, project)} />`.

- [ ] **Step 21: `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`**

`src/app/opengraph-image.tsx`: replace the import with `import { getSettings, toSiteConfig } from "@/lib/content";` and `import { availabilityLabels } from "@/lib/site-constants";`; replace the `alt` export with `export const alt = "Portfolio preview";`; then:

```tsx
export default async function OpengraphImage() {
  const settings = await getSettings();
  const siteConfig = toSiteConfig(settings);
  const hero = settings.hero;
  return new ImageResponse(
```

(rest unchanged, except `key={line}` → `key={index}` in `hero.lines.map`, since lines are now editable and may repeat).

`src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getCaseStudyProjects } from "@/lib/projects";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["/", "/work", "/about", "/services"].map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));

  const caseStudies = (await getCaseStudyProjects()).map((project) => ({
    url: absoluteUrl(`/work/${project.slug}`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...caseStudies];
}
```

`src/app/robots.ts`: `rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] },`

- [ ] **Step 22: Confirm nothing still imports `@/content`**

```bash
rmdir src/content 2>/dev/null || true
grep -rn "@/content" src || echo "clean"
```

Expected: `clean`.

- [ ] **Step 23: Verify against a real database**

Put `MONGODB_URI` / `MONGODB_DB` in `.env.local` (local `mongod` or a free Atlas cluster), then:

```bash
npm run db:seed
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: seed prints `seeded` for every collection; all checks pass; the build lists `/`, `/about`, `/services`, `/work`, `/work/[slug]`. `next build` needs the database (documented in Task 13). Run `npm run dev` and open `/`, `/about`, `/services`, `/work`, `/work/lms-platform` and `/does-not-exist` — each must look exactly as before.

- [ ] **Step 24: Commit**

```bash
git add -A src
git commit -m "feat: read public content from MongoDB via cached content layer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Admin authentication

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/session.test.ts`, `src/lib/auth/session-cookie.ts`, `src/lib/auth/dal.ts`, `src/lib/auth/dal.test.ts`, `src/lib/request.ts`, `src/proxy.ts`, `src/app/admin/layout.tsx`, `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`, `src/app/admin/login/login-form.tsx`, `src/app/admin/(panel)/actions.ts`

**Interfaces:**
- Consumes: `findAdminByEmail`, `findAdminById`, `Admin` (Task 2); `verifyPassword`, `hashPassword` (Task 3); `createRateLimiter` (Task 0); `loginSchema` (Task 1).
- Produces:
  - `SESSION_COOKIE = "admin_session"`, `SESSION_MAX_AGE` (seconds), `type SessionPayload = { adminId: string; sessionVersion: number }`, `signSession(payload): Promise<string>`, `verifySession(token?): Promise<SessionPayload | null>`
  - `setSessionCookie(payload): Promise<void>`, `clearSessionCookie(): Promise<void>`
  - `type AdminIdentity = { id: string; email: string }`, `resolveAdmin(token, findById): Promise<AdminIdentity | null>`, `getAdmin(): Promise<AdminIdentity | null>`, `requireAdmin(): Promise<AdminIdentity>` (redirects to `/admin/login`)
  - `clientIp(): Promise<string>`
  - Server actions: `login(state, formData)`, `logout()`

- [ ] **Step 1: Write the failing test `src/lib/auth/session.test.ts`**

```ts
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

const secret = "x".repeat(40);

beforeEach(() => {
  process.env.SESSION_SECRET = secret;
});

describe("session tokens", () => {
  it("round-trips the payload", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 3 });
    expect(await verifySession(token)).toEqual({ adminId: "a1", sessionVersion: 3 });
  });

  it("rejects missing, tampered and foreign-key tokens", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 1 });
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession(`${token.slice(0, -2)}xx`)).toBeNull();
    process.env.SESSION_SECRET = "y".repeat(40);
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const expired = await new SignJWT({ adminId: "a1", sessionVersion: 1 })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(0)
      .setExpirationTime(1)
      .sign(new TextEncoder().encode(secret));
    expect(await verifySession(expired)).toBeNull();
  });

  it("refuses to sign with a short secret", async () => {
    process.env.SESSION_SECRET = "short";
    await expect(signSession({ adminId: "a1", sessionVersion: 1 })).rejects.toThrow(/SESSION_SECRET/);
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/auth/session.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/lib/auth/session.ts`** (no `next/headers` here — `proxy.ts` imports it)

```ts
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = { adminId: string; sessionVersion: number };

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.adminId !== "string" || typeof payload.sessionVersion !== "number") return null;
    return { adminId: payload.adminId, sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run** `npm test -- src/lib/auth/session.test.ts` — Expected: 4 passed.

- [ ] **Step 5: Write the failing test `src/lib/auth/dal.test.ts`** (Review Focus 3)

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signSession } from "@/lib/auth/session";
import type { Admin } from "@/lib/db/admins";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { resolveAdmin } = await import("@/lib/auth/dal");

const admin: Admin = { id: "a1", email: "me@example.com", passwordHash: "h", sessionVersion: 2 };
const findById = async (id: string) => (id === admin.id ? admin : null);

beforeEach(() => {
  process.env.SESSION_SECRET = "x".repeat(40);
});

describe("resolveAdmin", () => {
  it("accepts a valid token with the current session version", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 2 });
    expect(await resolveAdmin(token, findById)).toEqual({ id: "a1", email: "me@example.com" });
  });

  it("rejects a token from before the last password change", async () => {
    const token = await signSession({ adminId: "a1", sessionVersion: 1 });
    expect(await resolveAdmin(token, findById)).toBeNull();
  });

  it("rejects a token for a deleted admin and a missing token", async () => {
    const token = await signSession({ adminId: "gone", sessionVersion: 2 });
    expect(await resolveAdmin(token, findById)).toBeNull();
    expect(await resolveAdmin(undefined, findById)).toBeNull();
  });
});
```

- [ ] **Step 6: Run** `npm test -- src/lib/auth/dal.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 7: Create `src/lib/auth/dal.ts`**

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";
import { findAdminById, type Admin } from "@/lib/db/admins";

export type AdminIdentity = { id: string; email: string };

/** A session is valid only if the JWT verifies AND its version matches the account (password changes bump it). */
export async function resolveAdmin(
  token: string | undefined,
  findById: (id: string) => Promise<Admin | null>,
): Promise<AdminIdentity | null> {
  const session = await verifySession(token);
  if (!session) return null;
  const admin = await findById(session.adminId);
  if (!admin || admin.sessionVersion !== session.sessionVersion) return null;
  return { id: admin.id, email: admin.email };
}

export const getAdmin = cache(async () => resolveAdmin((await cookies()).get(SESSION_COOKIE)?.value, findAdminById));

/** Call first in every admin page and Server Action. Layouts alone are not enough: they don't re-run on navigation. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
```

- [ ] **Step 8: Run** `npm test -- src/lib/auth/dal.test.ts` — Expected: 3 passed.

- [ ] **Step 9: Create `src/lib/auth/session-cookie.ts`**

```ts
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, type SessionPayload } from "@/lib/auth/session";

export async function setSessionCookie(payload: SessionPayload) {
  (await cookies()).set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}
```

- [ ] **Step 10: Create `src/lib/request.ts`**

```ts
import { headers } from "next/headers";

export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
```

- [ ] **Step 11: Create `src/proxy.ts`** (optimistic check only — `requireAdmin()` is the real gate)

```ts
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
```

- [ ] **Step 12: Create `src/app/admin/layout.tsx`**

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-frame">{children}</div>;
}
```

- [ ] **Step 13: Create `src/app/admin/login/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { findAdminByEmail } from "@/lib/db/admins";
import { loginSchema } from "@/lib/db/schemas";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export type LoginState = { error: string } | undefined;

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
const invalidCredentials = { error: "Invalid email or password." };

// Compared against when the email is unknown, so both failure paths take the same time.
let dummyHash: Promise<string> | undefined;

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return invalidCredentials;

  const email = parsed.data.email.toLowerCase();
  const ipLimited = limiter.hit(`ip:${await clientIp()}`);
  const emailLimited = limiter.hit(`email:${email}`);
  if (ipLimited || emailLimited) return { error: "Too many attempts. Try again in 15 minutes." };

  const admin = await findAdminByEmail(email);
  dummyHash ??= hashPassword("not-the-password");
  const valid = await verifyPassword(parsed.data.password, admin?.passwordHash ?? (await dummyHash));
  if (!admin || !valid) return invalidCredentials;

  limiter.reset(`email:${email}`);
  await setSessionCookie({ adminId: admin.id, sessionVersion: admin.sessionVersion });
  redirect("/admin");
}
```

- [ ] **Step 14: Create `src/app/admin/login/login-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 grid gap-4" noValidate>
      <label className="grid gap-1.5">
        <span className="meta font-bold">Email</span>
        <input name="email" type="email" autoComplete="username" required className="field" />
      </label>
      <label className="grid gap-1.5">
        <span className="meta font-bold">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="field" />
      </label>
      {state?.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-accent" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 15: Create `src/app/admin/login/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/admin/login/login-form";
import { Card } from "@/components/ui/card";
import { getAdmin } from "@/lib/auth/dal";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <Card tone="paper" className="w-full max-w-md p-6 sm:p-8">
        <p className="meta font-bold">Admin</p>
        <h1 className="title mt-2 text-4xl">Sign in</h1>
        <LoginForm />
      </Card>
    </main>
  );
}
```

- [ ] **Step 16: Create `src/app/admin/(panel)/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie } from "@/lib/auth/session-cookie";

export async function logout() {
  await clearSessionCookie();
  redirect("/admin/login");
}
```

- [ ] **Step 17: Verify** — `npm run typecheck && npm test`. Then add `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` to `.env.local`, run `npm run admin:create`, `npm run dev`:
  - `/admin` → redirected to `/admin/login` (the panel page arrives in Task 8; a 404 after sign-in is expected until then).
  - Wrong password → "Invalid email or password."; six quick wrong attempts → "Too many attempts…".
  - Correct password → redirected to `/admin`, and the browser has an `admin_session` cookie marked HttpOnly.

- [ ] **Step 18: Commit**

```bash
git add src/lib/auth src/lib/request.ts src/proxy.ts src/app/admin
git commit -m "feat(admin): password login with signed session cookie

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Inquiries saved to MongoDB, owner notification, client auto-reply

**Files:**
- Modify: `src/lib/inquiry.ts`, `src/lib/mail.ts`, `src/lib/inquiry-action.ts`, `src/components/inquiry/inquiry-dialog.tsx`
- Create: `src/lib/inquiry.test.ts`, `src/lib/inquiry-flow.ts`, `src/lib/inquiry-flow.test.ts`, `src/lib/mail.test.ts`

**Interfaces:**
- Consumes: `createInquiry`, `markEmailFailed` (Task 2); `getSettings` (Task 4); `createRateLimiter` (Task 0); `clientIp` (Task 5); `absoluteUrl` (Task 4).
- Produces:
  - `inquiryFields = ["name", "email", "phone", "services", "businessDetails"]`; `validateInquiryField(field, values, services: readonly string[])`; `validateInquiry(values, services)`.
  - `type OutgoingEmail = { to: string; subject: string; text: string; replyTo?: string }`; `sendEmail(email): Promise<boolean>`; `inquiryNotification(values, inquiryId: string | null, ownerEmail): OutgoingEmail`; `inquiryAutoReply(values, settings): OutgoingEmail`.
  - `processInquiry(values, deps): Promise<boolean>`.

- [ ] **Step 1: Write the failing test `src/lib/inquiry.test.ts`** (Review Focus 5)

```ts
import { describe, expect, it } from "vitest";
import { normalizeInquiry, validateInquiry } from "@/lib/inquiry";

const services = ["Website Development", "SEO"];
const valid = { name: "Ada", email: "ada@example.com", phone: "+91 98765 43210", services: ["SEO"], businessDetails: "A new shop site." };

describe("validateInquiry", () => {
  it("accepts a complete request", () => {
    expect(validateInquiry(valid, services)).toEqual({});
  });

  it("rejects a service that is not currently offered", () => {
    expect(validateInquiry({ ...valid, services: ["Mobile App"] }, services).services).toBeDefined();
  });

  it("requires a valid email", () => {
    expect(validateInquiry({ ...valid, email: "" }, services).email).toBeDefined();
    expect(validateInquiry({ ...valid, email: "not-an-email" }, services).email).toBeDefined();
  });
});

describe("normalizeInquiry", () => {
  it("trims and lowercases the email", () => {
    expect(normalizeInquiry({ ...valid, email: "  Ada@Example.COM " }).email).toBe("ada@example.com");
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/inquiry.test.ts` — Expected: FAIL (validateInquiry ignores the services argument / email not validated).

- [ ] **Step 3: Replace `src/lib/inquiry.ts`**

```ts
/** Project inquiry: fields and validation shared by the modal and the server action. Service options come from settings. */

export const inquiryFields = ["name", "email", "phone", "services", "businessDetails"] as const;

export type InquiryField = (typeof inquiryFields)[number];
export type InquiryValues = {
  name: string;
  email: string;
  phone: string;
  services: string[];
  businessDetails: string;
};
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export const emptyInquiry: InquiryValues = { name: "", email: "", phone: "", services: [], businessDetails: "" };

const phonePattern = /^\+?[\d\s\-().]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiryField(field: InquiryField, values: InquiryValues, services: readonly string[]): string | undefined {
  switch (field) {
    case "name": {
      const name = values.name.trim();
      if (!name) return "Please tell us your name.";
      if (name.length > 100) return "Please keep your name under 100 characters.";
      return undefined;
    }
    case "email": {
      const email = values.email.trim();
      if (!email) return "Please add your email so we can reply.";
      if (email.length > 200 || !emailPattern.test(email)) return "Please enter a valid email address.";
      return undefined;
    }
    case "phone": {
      const phone = values.phone.trim();
      const digits = phone.replace(/\D/g, "").length;
      if (!phone) return "Please add a phone or WhatsApp number.";
      if (!phonePattern.test(phone) || digits < 7 || digits > 15) return "Please enter a valid phone number.";
      return undefined;
    }
    case "services":
      if (values.services.length === 0) return "Pick at least one service.";
      if (values.services.some((service) => !services.includes(service))) return "Please pick from the listed services.";
      return undefined;
    case "businessDetails": {
      const details = values.businessDetails.trim();
      if (!details) return "Please tell us a little about your project.";
      if (details.length < 10) return "Please add a little more detail.";
      if (details.length > 5000) return "Please keep this under 5,000 characters.";
      return undefined;
    }
  }
}

export function validateInquiry(values: InquiryValues, services: readonly string[]): InquiryErrors {
  const errors: InquiryErrors = {};
  for (const field of inquiryFields) {
    const error = validateInquiryField(field, values, services);
    if (error) errors[field] = error;
  }
  return errors;
}

/** Coerces untrusted input (e.g. the server action's argument) into trimmed inquiry values. */
export function normalizeInquiry(input: Partial<Record<keyof InquiryValues, unknown>>): InquiryValues {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const services = Array.isArray(input.services) ? input.services.filter((item): item is string => typeof item === "string") : [];

  return {
    name: text(input.name),
    email: text(input.email).toLowerCase(),
    phone: text(input.phone),
    services: [...new Set(services)],
    businessDetails: text(input.businessDetails),
  };
}
```

- [ ] **Step 4: Run** `npm test -- src/lib/inquiry.test.ts` — Expected: 4 passed.

- [ ] **Step 5: Write the failing test `src/lib/mail.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { inquiryAutoReply, inquiryNotification, sendEmail } from "@/lib/mail";

const values = { name: "Ada\r\nBcc: x@y.z", email: "ada@example.com", phone: "123 4567", services: ["SEO"], businessDetails: "Details here." };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("sendEmail", () => {
  it("posts to Resend with reply_to and a single-line subject", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmail({ to: "a@b.c", subject: "Hi\nthere", text: "Body", replyTo: "me@x.y" })).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ to: ["a@b.c"], subject: "Hi there", text: "Body", reply_to: "me@x.y" });
  });

  it("returns false when Resend rejects", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad", { status: 422 })));
    expect(await sendEmail({ to: "a@b.c", subject: "s", text: "t" })).toBe(false);
  });
});

describe("templates", () => {
  it("notification links to the admin inbox and replies to the client", () => {
    const email = inquiryNotification(values, "abc123", "owner@x.y");
    expect(email.text).toContain("/admin/inquiries/abc123");
    expect(email.replyTo).toBe("ada@example.com");
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it("auto-reply goes to the client with the configured message", () => {
    const email = inquiryAutoReply(values, { brand: "AnbuDev", name: "Anbu", email: "owner@x.y", autoReplyMessage: "Thanks!" });
    expect(email.to).toBe("ada@example.com");
    expect(email.replyTo).toBe("owner@x.y");
    expect(email.text).toContain("Thanks!");
  });
});
```

- [ ] **Step 6: Run** `npm test -- src/lib/mail.test.ts` — Expected: FAIL (`sendEmail` not exported).

- [ ] **Step 7: Replace `src/lib/mail.ts`**

```ts
import type { Settings } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";
import { absoluteUrl } from "@/lib/seo";

export type OutgoingEmail = { to: string; subject: string; text: string; replyTo?: string };

// Header values must never carry line breaks.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Sends through Resend's REST API (no SDK dependency).
 * Without RESEND_API_KEY the email is logged in development and rejected in production,
 * so a missing key can never silently swallow a real message.
 */
export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] RESEND_API_KEY not set — logging instead of sending:\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`);
      return true;
    }
    console.error("[mail] RESEND_API_KEY is not set; email was not sent.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL ?? "Portfolio <onboarding@resend.dev>",
        to: [email.to],
        subject: oneLine(email.subject),
        text: email.text,
        ...(email.replyTo && { reply_to: oneLine(email.replyTo) }),
      }),
    });

    if (!response.ok) {
      console.error("[mail] Resend responded with", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mail] Failed to reach Resend", error);
    return false;
  }
}

function requestSummary(values: InquiryValues) {
  return [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone / WhatsApp: ${values.phone}`,
    `Services: ${values.services.join(", ")}`,
    "",
    values.businessDetails,
  ];
}

export function inquiryNotification(values: InquiryValues, inquiryId: string | null, ownerEmail: string): OutgoingEmail {
  const footer = inquiryId
    ? `Open in admin: ${absoluteUrl(`/admin/inquiries/${inquiryId}`)}`
    : "This request could not be saved to the database — reply to this email directly.";

  return {
    to: process.env.CONTACT_TO_EMAIL || ownerEmail,
    subject: `New project request — ${oneLine(values.name)}`,
    replyTo: values.email,
    text: [...requestSummary(values), "", footer].join("\n"),
  };
}

export function inquiryAutoReply(
  values: InquiryValues,
  settings: Pick<Settings, "brand" | "name" | "email" | "autoReplyMessage">,
): OutgoingEmail {
  return {
    to: values.email,
    replyTo: settings.email,
    subject: `We received your project request — ${settings.brand}`,
    text: [
      `Hi ${oneLine(values.name)},`,
      "",
      settings.autoReplyMessage,
      "",
      "Here's a copy of what you sent:",
      "",
      ...requestSummary(values),
      "",
      `— ${settings.name}`,
    ].join("\n"),
  };
}
```

- [ ] **Step 8: Run** `npm test -- src/lib/mail.test.ts` — Expected: 4 passed.

- [ ] **Step 9: Write the failing test `src/lib/inquiry-flow.test.ts`** (Review Focus 4)

```ts
import { describe, expect, it, vi } from "vitest";
import { processInquiry } from "@/lib/inquiry-flow";
import type { OutgoingEmail } from "@/lib/mail";

const values = { name: "Ada", email: "ada@example.com", phone: "123 4567", services: ["SEO"], businessDetails: "Details here." };
const settings = { brand: "AnbuDev", name: "Anbu", email: "owner@x.y", autoReplyMessage: "Thanks!" };

/** `emails` are the results of the owner notification and the client auto-reply, in that order. */
function deps({ saved = true, emails = [true, true] }: { saved?: boolean; emails?: boolean[] } = {}) {
  const sendEmail = vi.fn<(email: OutgoingEmail) => Promise<boolean>>();
  for (const result of emails) sendEmail.mockResolvedValueOnce(result);
  return {
    settings,
    createInquiry: saved ? vi.fn(async () => "id1") : vi.fn(async (): Promise<string> => { throw new Error("down"); }),
    markEmailFailed: vi.fn(async (id: string) => void id),
    sendEmail,
  };
}

describe("processInquiry", () => {
  it("saves, notifies the owner and auto-replies to the client", async () => {
    const d = deps();
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.sendEmail.mock.calls.map(([email]) => email.to).sort()).toEqual(["ada@example.com", "owner@x.y"]);
    expect(d.markEmailFailed).not.toHaveBeenCalled();
  });

  it("flags the saved inquiry when an email fails, and still succeeds", async () => {
    const d = deps({ emails: [false, true] });
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.markEmailFailed).toHaveBeenCalledWith("id1");
  });

  it("succeeds on the owner email alone when the database is down", async () => {
    const d = deps({ saved: false });
    expect(await processInquiry(values, d)).toBe(true);
    expect(d.sendEmail.mock.calls[0][0].text).toContain("could not be saved");
  });

  it("fails only when both the save and the owner email fail", async () => {
    const d = deps({ saved: false, emails: [false, false] });
    expect(await processInquiry(values, d)).toBe(false);
  });
});
```

- [ ] **Step 10: Run** `npm test -- src/lib/inquiry-flow.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 11: Create `src/lib/inquiry-flow.ts`**

```ts
import type { Settings } from "@/lib/db/schemas";
import type { InquiryValues } from "@/lib/inquiry";
import { inquiryAutoReply, inquiryNotification, type OutgoingEmail } from "@/lib/mail";

export type InquiryDeps = {
  settings: Pick<Settings, "brand" | "name" | "email" | "autoReplyMessage">;
  createInquiry: (values: InquiryValues) => Promise<string>;
  markEmailFailed: (id: string) => Promise<void>;
  sendEmail: (email: OutgoingEmail) => Promise<boolean>;
};

/**
 * Save first, then email. The request counts as received if it was saved OR the owner was emailed;
 * a saved request whose emails failed is flagged so it stands out in the admin inbox.
 */
export async function processInquiry(values: InquiryValues, deps: InquiryDeps): Promise<boolean> {
  let id: string | null = null;
  try {
    id = await deps.createInquiry(values);
  } catch (error) {
    console.error("[inquiry] Failed to save to the database", error);
  }

  const notified = await deps.sendEmail(inquiryNotification(values, id, deps.settings.email));
  const acknowledged = await deps.sendEmail(inquiryAutoReply(values, deps.settings));

  if (id && (!notified || !acknowledged)) {
    await deps.markEmailFailed(id).catch((error) => console.error("[inquiry] Failed to flag email failure", error));
  }

  return Boolean(id) || notified;
}
```

- [ ] **Step 12: Run** `npm test -- src/lib/inquiry-flow.test.ts` — Expected: 4 passed.

- [ ] **Step 13: Replace `src/lib/inquiry-action.ts`**

```ts
"use server";

import { getSettings } from "@/lib/content";
import { createInquiry, markEmailFailed } from "@/lib/db/inquiries";
import { normalizeInquiry, validateInquiry, type InquiryErrors, type InquiryValues } from "@/lib/inquiry";
import { processInquiry } from "@/lib/inquiry-flow";
import { sendEmail } from "@/lib/mail";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

const MIN_FILL_MS = 3000;
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

export type InquirySubmission = InquiryValues & {
  /** Honeypot — people never see this field. */
  website?: string;
  /** When the modal was first opened (ms since epoch). */
  startedAt: number;
};

export type InquiryResult = { status: "success" } | { status: "invalid"; errors: InquiryErrors } | { status: "error" };

/** The one entry point for project requests; the modal only calls this. */
export async function submitInquiry(submission: InquirySubmission): Promise<InquiryResult> {
  // Report success to bots so they learn nothing.
  if (submission.website) return { status: "success" };

  // Time trap: submitted faster than a person could fill in the steps.
  if (!submission.startedAt || Date.now() - submission.startedAt < MIN_FILL_MS) return { status: "error" };

  const settings = await getSettings();
  const values = normalizeInquiry(submission);
  const errors = validateInquiry(values, settings.inquiryServices);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };

  if (limiter.hit(await clientIp())) return { status: "error" };

  const received = await processInquiry(values, { settings, createInquiry, markEmailFailed, sendEmail });
  return received ? { status: "success" } : { status: "error" };
}
```

- [ ] **Step 14: Add the email step to `src/components/inquiry/inquiry-dialog.tsx`**

1. In `steps`, after `name`, add:
   ```ts
   email: { label: "Email", heading: "Where should we reply?", hint: "We'll send a copy of your request here." },
   ```
2. In `handleSubmit`: `const error = validateInquiryField(field, values, services);`
3. After the `field === "name"` input block, add:
   ```tsx
   {field === "email" && (
     <input
       {...control}
       type="email"
       name="email"
       inputMode="email"
       autoComplete="email"
       placeholder="you@company.com"
       maxLength={200}
       value={values.email}
       onChange={(event) => update("email", event.target.value)}
       className="field inquiry-field"
     />
   )}
   ```
4. The success copy stays; add a line under it: `<p className="inquiry-sub">A copy is on its way to {values.email}.</p>` (before `handleClosed` resets `values`, this still shows the address).

- [ ] **Step 15: Verify** — `npm run typecheck && npm run lint && npm test`. In `npm run dev` (no `RESEND_API_KEY`): open "Start project", complete all five steps; the terminal logs two emails (owner + client) and a document appears in `inquiries` (check with `mongosh` or Atlas UI).

- [ ] **Step 16: Commit**

```bash
git add src/lib src/components/inquiry
git commit -m "feat(inquiry): save requests to MongoDB, auto-reply to clients

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: ImageKit upload auth and cleanup

**Files:**
- Create: `src/lib/imagekit.ts`, `src/lib/imagekit.test.ts`, `src/app/api/admin/imagekit-auth/route.ts`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `getAdmin` (Task 5), `ImageRef` (Task 1).
- Produces: `getUploadAuth(now?): { token: string; expire: number; signature: string; publicKey: string }`; `deleteImage(fileId): Promise<void>`; `deleteReplacedImages(before: (ImageRef | undefined)[], after: (ImageRef | undefined)[]): Promise<void>`; `GET /api/admin/imagekit-auth`.

- [ ] **Step 1: Write the failing test `src/lib/imagekit.test.ts`**

```ts
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteReplacedImages, getUploadAuth } from "@/lib/imagekit";

beforeEach(() => {
  vi.stubEnv("IMAGEKIT_PRIVATE_KEY", "private_test");
  vi.stubEnv("IMAGEKIT_PUBLIC_KEY", "public_test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getUploadAuth", () => {
  it("signs token + expire with the private key and expires within 10 minutes", () => {
    const auth = getUploadAuth(1_000_000);
    expect(auth.publicKey).toBe("public_test");
    expect(auth.expire).toBe(1000 + 600);
    expect(auth.signature).toBe(createHmac("sha1", "private_test").update(auth.token + auth.expire).digest("hex"));
  });
});

describe("deleteReplacedImages", () => {
  it("deletes only files that are no longer referenced", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const keep = { url: "u1", fileId: "keep", alt: "" };
    const old = { url: "u2", fileId: "old", alt: "" };

    await deleteReplacedImages([keep, old, undefined], [keep, undefined]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.imagekit.io/v1/files/old");
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("never throws when ImageKit is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(deleteReplacedImages([{ url: "u", fileId: "f", alt: "" }], [])).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/imagekit.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/lib/imagekit.ts`**

```ts
import { createHmac, randomUUID } from "node:crypto";
import type { ImageRef } from "@/lib/db/schemas";

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

/** Short-lived signature that lets the admin's browser upload straight to ImageKit. */
export function getUploadAuth(now = Date.now()) {
  const token = randomUUID();
  const expire = Math.floor(now / 1000) + 600;
  const signature = createHmac("sha1", env("IMAGEKIT_PRIVATE_KEY")).update(token + expire).digest("hex");
  return { token, expire, signature, publicKey: env("IMAGEKIT_PUBLIC_KEY") };
}

/** Best effort: a failed delete leaves an orphaned file, never a failed save. */
export async function deleteImage(fileId: string) {
  try {
    const auth = Buffer.from(`${env("IMAGEKIT_PRIVATE_KEY")}:`).toString("base64");
    const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!response.ok && response.status !== 404) console.error("[imagekit] Delete failed", fileId, response.status);
  } catch (error) {
    console.error("[imagekit] Delete failed", fileId, error);
  }
}

export async function deleteReplacedImages(before: (ImageRef | undefined)[], after: (ImageRef | undefined)[]) {
  const kept = new Set(after.filter(Boolean).map((image) => image!.fileId));
  const removed = before.filter((image): image is ImageRef => Boolean(image) && !kept.has(image!.fileId));
  await Promise.all(removed.map((image) => deleteImage(image.fileId)));
}
```

- [ ] **Step 4: Run** `npm test -- src/lib/imagekit.test.ts` — Expected: 3 passed.

- [ ] **Step 5: Create `src/app/api/admin/imagekit-auth/route.ts`**

```ts
import { getAdmin } from "@/lib/auth/dal";
import { getUploadAuth } from "@/lib/imagekit";

export async function GET() {
  if (!(await getAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(getUploadAuth(), { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 6: Allow ImageKit images in `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded images live on ImageKit. Add your custom domain here if you set one up in ImageKit.
    remotePatterns: [new URL("https://ik.imagekit.io/**")],
  },
  redirects() {
    // The contact page became the "Start project" modal; old links open it on the home page.
    return [{ source: "/contact", destination: "/?start=project", permanent: true }];
  },
};

export default nextConfig;
```

- [ ] **Step 7: Verify** — `npm run typecheck && npm test`. With `npm run dev`: `curl -i http://localhost:3000/api/admin/imagekit-auth` → `401`; in a signed-in browser tab the same URL returns JSON with `token`, `expire`, `signature`, `publicKey`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/imagekit.ts src/lib/imagekit.test.ts src/app/api next.config.ts
git commit -m "feat(images): ImageKit upload signatures and cleanup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Admin UI kit and panel shell

**Files:**
- Create: `src/lib/admin/action-result.ts`, `src/lib/admin/refresh.ts`, `src/lib/admin/paths.ts`, `src/lib/admin/paths.test.ts`, `src/lib/admin/collection-actions.ts`, `src/lib/admin/collection-actions.test.ts`, `src/components/admin/field-configs.ts`, `src/components/admin/field-input.tsx`, `src/components/admin/image-field.tsx`, `src/components/admin/entity-form.tsx`, `src/components/admin/ordered-list-editor.tsx`, `src/components/admin/admin-nav.tsx`, `src/app/admin/(panel)/layout.tsx`, `src/app/admin/(panel)/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin` (Task 5), `OrderedRepo` (Task 2), `ContentTag` (Task 4), `deleteReplacedImages` (Task 7), `countInquiries`, `listInquiries` (Task 2), `logout` (Task 5).
- Produces:
  - `type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }`; `invalid(zodError)`; `failed(message?)`; `fromDbError(error)`
  - `refresh(...tags: ContentTag[])`
  - `getPath(source, "a.b")`, `setPath(source, "a.b", value)`
  - `collectionActions({ repo, schema, tags, imageFields? })` → `{ create(input), update(id, input), remove(id), move(id, direction) }`, all `Promise<ActionResult>`
  - `type FieldConfig`, `type FormSection = { title?: string; fields: FieldConfig[] }`, `emptyValues(sections)`, and section configs: `serviceSections`, `processSections`, `experienceSections`, `stackSections`, `testimonialSections`, `projectSections`, `settingsSections`, `replySections`
  - `<EntityForm sections initial action submitLabel? redirectOnCreate? resetOnSuccess? onDone? />`
  - `<OrderedListEditor items sections empty titleField subtitleField? noun create update remove move />`

- [ ] **Step 1: Write the failing test `src/lib/admin/paths.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { getPath, setPath } from "@/lib/admin/paths";

describe("paths", () => {
  it("reads nested values", () => {
    expect(getPath({ social: { github: "g" } }, "social.github")).toBe("g");
    expect(getPath({}, "social.github")).toBeUndefined();
  });

  it("sets nested values without mutating the source", () => {
    const source = { social: { github: "g", fiverr: "f" }, name: "n" };
    const next = setPath(source, "social.github", "h");
    expect(next).toEqual({ social: { github: "h", fiverr: "f" }, name: "n" });
    expect(source.social.github).toBe("g");
  });

  it("creates missing parents", () => {
    expect(setPath({}, "hero.roles", "r")).toEqual({ hero: { roles: "r" } });
  });
});
```

- [ ] **Step 2: Run** `npm test -- src/lib/admin/paths.test.ts` — Expected: FAIL, module not found.

- [ ] **Step 3: Create `src/lib/admin/paths.ts`**

```ts
type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a dotted path such as "social.github". */
export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (isObj(value) ? value[key] : undefined), source);
}

/** Immutable set of a dotted path; missing parents are created. */
export function setPath<T extends Obj>(source: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) return { ...source, [head]: value };
  const child = isObj(source[head]) ? (source[head] as Obj) : {};
  return { ...source, [head]: setPath(child, rest.join("."), value) };
}
```

- [ ] **Step 4: Run** `npm test -- src/lib/admin/paths.test.ts` — Expected: 3 passed.

- [ ] **Step 5: Create `src/lib/admin/action-result.ts`**

```ts
import type { ZodError } from "zod";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Field errors keyed by dotted path ("hero.accentLine", "includes.2"), first message per path. */
export function invalid(error: ZodError): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

export function failed(error = "Something went wrong. Please try again."): ActionResult {
  return { ok: false, error };
}

export function fromDbError(error: unknown): ActionResult {
  if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
    return { ok: false, error: "That slug is already used by another project.", fieldErrors: { slug: "Already in use." } };
  }
  console.error("[admin] Database write failed", error);
  return failed("Couldn't save — the database didn't respond. Your changes are still in the form.");
}
```

- [ ] **Step 6: Create `src/lib/admin/refresh.ts`**

```ts
import { revalidateTag } from "next/cache";
import type { ContentTag } from "@/lib/content";

/** Expires public content immediately so the next visit sees the admin's change. */
export function refresh(...tags: ContentTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
```

- [ ] **Step 7: Create `src/lib/admin/collection-actions.ts`**

```ts
import type { z } from "zod";
import { failed, fromDbError, invalid, type ActionResult } from "@/lib/admin/action-result";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import type { ContentTag } from "@/lib/content";
import type { OrderedRepo } from "@/lib/db/ordered-repo";
import type { ImageRef } from "@/lib/db/schemas";
import { deleteReplacedImages } from "@/lib/imagekit";

type Options<S extends z.ZodType<object>> = {
  repo: OrderedRepo<z.output<S>>;
  schema: S;
  tags: ContentTag[];
  /** Top-level fields holding an ImageRef; replaced or removed files are deleted from ImageKit. */
  imageFields?: string[];
};

/**
 * CRUD + reorder actions for one ordered collection. Wrap each method in an exported
 * async function inside a "use server" file — only those can be called from the browser.
 */
export function collectionActions<S extends z.ZodType<object>>({ repo, schema, tags, imageFields = [] }: Options<S>) {
  const imagesOf = (doc: object | null) => imageFields.map((field) => (doc as Record<string, ImageRef | undefined> | null)?.[field]);

  return {
    async create(input: unknown): Promise<ActionResult> {
      await requireAdmin();
      const parsed = schema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      try {
        const id = await repo.create(parsed.data);
        refresh(...tags);
        return { ok: true, id };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async update(id: string, input: unknown): Promise<ActionResult> {
      await requireAdmin();
      const parsed = schema.safeParse(input);
      if (!parsed.success) return invalid(parsed.error);
      try {
        const result = await repo.update(id, parsed.data);
        if (!result) return failed("This item no longer exists. Reload the page.");
        await deleteReplacedImages(imagesOf(result.before), imagesOf(result.after));
        refresh(...tags);
        return { ok: true, id };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async remove(id: string): Promise<ActionResult> {
      await requireAdmin();
      try {
        const removed = await repo.remove(id);
        if (removed) await deleteReplacedImages(imagesOf(removed), []);
        refresh(...tags);
        return { ok: true };
      } catch (error) {
        return fromDbError(error);
      }
    },

    async move(id: string, direction: "up" | "down"): Promise<ActionResult> {
      await requireAdmin();
      if (direction !== "up" && direction !== "down") return failed();
      try {
        await repo.move(id, direction);
        refresh(...tags);
        return { ok: true };
      } catch (error) {
        return fromDbError(error);
      }
    },
  };
}
```

If TypeScript cannot relate `z.output<S>` between `schema` and `repo`, call sites pass the concrete types instead — e.g. `collectionActions<typeof serviceSchema>({ … })`; do not add `any`.

- [ ] **Step 7b: Test the collection actions `src/lib/admin/collection-actions.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { collectionActions } from "@/lib/admin/collection-actions";
import { refresh } from "@/lib/admin/refresh";
import { repos } from "@/lib/db/repos";
import { projectSchema } from "@/lib/db/schemas";
import { deleteReplacedImages } from "@/lib/imagekit";
import { setupTestDb } from "@/test/mongo";

vi.mock("@/lib/auth/dal", () => ({ requireAdmin: vi.fn(async () => ({ id: "a1", email: "me@example.com" })) }));
vi.mock("@/lib/admin/refresh", () => ({ refresh: vi.fn() }));
vi.mock("@/lib/imagekit", () => ({ deleteReplacedImages: vi.fn(async () => {}) }));

setupTestDb();

beforeEach(() => {
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
  vi.clearAllMocks();
});

const actions = collectionActions({ repo: repos.projects, schema: projectSchema, tags: ["projects"], imageFields: ["image"] });
const project = { slug: "one", title: "One", description: "d", year: "2026", category: ["c"], technologies: ["t"], featured: false, features: [], metrics: [] };
const image = (fileId: string) => ({ url: `https://ik.imagekit.io/demo/${fileId}.png`, fileId, alt: "" });

describe("collectionActions", () => {
  it("returns field errors and writes nothing for invalid input", async () => {
    expect(await actions.create({ ...project, slug: "Bad Slug" })).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } });
    expect(await repos.projects.count()).toBe(0);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("creates and expires the public tag", async () => {
    expect(await actions.create(project)).toMatchObject({ ok: true, id: expect.any(String) });
    expect(refresh).toHaveBeenCalledWith("projects");
  });

  it("reports a duplicate slug on the slug field", async () => {
    await actions.create(project);
    expect(await actions.create(project)).toMatchObject({ ok: false, fieldErrors: { slug: "Already in use." } });
  });

  it("deletes the previous image when it is replaced, and on delete", async () => {
    const created = await actions.create({ ...project, image: image("old") });
    if (!created.ok || !created.id) throw new Error("create failed");
    await actions.update(created.id, { ...project, image: image("new") });
    expect(deleteReplacedImages).toHaveBeenCalledWith([image("old")], [image("new")]);
    await actions.remove(created.id);
    expect(deleteReplacedImages).toHaveBeenLastCalledWith([image("new")], []);
  });

  it("fails cleanly when the item no longer exists", async () => {
    expect(await actions.update("000000000000000000000000", project)).toMatchObject({ ok: false });
  });
});
```

Run `npm test -- src/lib/admin/collection-actions.test.ts` — Expected: 5 passed.

- [ ] **Step 8: Create `src/components/admin/field-configs.ts`** (plain data — safe to pass from server to client components)

```ts
export type ImageFolder = "projects" | "portrait" | "testimonials";

type Base = { name: string; label: string; hint?: string };

export type FieldConfig = Base &
  (
    | { type: "text" | "email" | "url" }
    | { type: "textarea"; rows?: number }
    | { type: "number"; min?: number; max?: number; step?: number }
    | { type: "list"; itemLabel: string; multiline?: boolean }
    | { type: "toggle" }
    | { type: "select"; options: readonly { value: string; label: string }[] }
    | { type: "image"; folder: ImageFolder }
    | { type: "pairs"; keys: readonly [string, string]; keyLabels: readonly [string, string] }
  );

export type FormSection = { title?: string; fields: FieldConfig[] };

/** Blank values for a "new item" form. */
export function emptyValues(sections: FormSection[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    if (field.type === "list" || field.type === "pairs") values[field.name] = [];
    else if (field.type === "toggle") values[field.name] = false;
    else if (field.type === "select") values[field.name] = field.options[0]?.value ?? "";
    else if (field.type === "number" || field.type === "image") values[field.name] = undefined;
    else values[field.name] = "";
  }
  return values;
}

export const serviceSections: FormSection[] = [
  {
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "description", label: "Short description", type: "textarea", rows: 2 },
      { name: "includes", label: "What's included", type: "list", itemLabel: "Item" },
    ],
  },
];

export const processSections: FormSection[] = [
  {
    fields: [
      { name: "title", label: "Step title", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
    ],
  },
];

export const experienceSections: FormSection[] = [
  {
    fields: [
      { name: "role", label: "Role", type: "text" },
      { name: "company", label: "Company or client", type: "text" },
      { name: "period", label: "Period", type: "text", hint: "e.g. 2024 – Present" },
    ],
  },
];

export const stackSections: FormSection[] = [
  {
    fields: [
      { name: "label", label: "Group label", type: "text", hint: "e.g. Frontend" },
      { name: "items", label: "Technologies", type: "list", itemLabel: "Technology" },
    ],
  },
];

export const testimonialSections: FormSection[] = [
  {
    fields: [
      { name: "quote", label: "Quote", type: "textarea", rows: 4, hint: "Only publish real feedback you have permission to use." },
      { name: "name", label: "Client name", type: "text" },
      { name: "role", label: "Their role", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "rating", label: "Rating (1–5, optional)", type: "number", min: 1, max: 5, step: 0.1 },
      { name: "avatar", label: "Photo (optional)", type: "image", folder: "testimonials" },
      { name: "published", label: "Show on the site", type: "toggle" },
    ],
  },
];

export const projectSections: FormSection[] = [
  {
    title: "Basics",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "slug", label: "URL slug", type: "text", hint: "Used in /work/<slug>. Lowercase, numbers and dashes." },
      { name: "description", label: "One-line description", type: "textarea", rows: 2 },
      { name: "year", label: "Year", type: "text" },
      { name: "category", label: "Categories", type: "list", itemLabel: "Category", hint: "“Web application” + a live URL links the card straight to the live site." },
      { name: "technologies", label: "Technologies", type: "list", itemLabel: "Technology" },
      { name: "featured", label: "Feature on the home page", type: "toggle" },
      { name: "image", label: "Cover image", type: "image", folder: "projects" },
    ],
  },
  {
    title: "Links & credits",
    fields: [
      { name: "liveUrl", label: "Live URL", type: "url" },
      { name: "githubUrl", label: "Source code URL", type: "url" },
      { name: "client", label: "Client", type: "text" },
      { name: "role", label: "Your role", type: "text" },
    ],
  },
  {
    title: "Case study",
    fields: [
      { name: "overview", label: "Overview", type: "textarea", rows: 4 },
      { name: "problem", label: "Problem", type: "textarea", rows: 4 },
      { name: "approach", label: "Approach", type: "textarea", rows: 4 },
      { name: "features", label: "Key features", type: "list", itemLabel: "Feature" },
      { name: "engineering", label: "Design / engineering", type: "textarea", rows: 4 },
      { name: "result", label: "Result", type: "textarea", rows: 4, hint: "Only real outcomes." },
      { name: "metrics", label: "Metrics", type: "pairs", keys: ["label", "value"], keyLabels: ["Label", "Value"] },
    ],
  },
];

export const settingsSections: FormSection[] = [
  {
    title: "Profile",
    fields: [
      { name: "brand", label: "Brand (browser tab + logo)", type: "text" },
      { name: "name", label: "Your name", type: "text" },
      { name: "title", label: "Title", type: "text" },
      { name: "role", label: "Role (home page heading)", type: "text" },
      { name: "description", label: "Site description (SEO)", type: "textarea", rows: 2 },
      { name: "focus", label: "Focus", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "email", label: "Public email", type: "email" },
      { name: "portrait", label: "Portrait", type: "image", folder: "portrait" },
      { name: "resumeUrl", label: "Resume URL", type: "url" },
      {
        name: "availability",
        label: "Availability",
        type: "select",
        options: [
          { value: "available", label: "Available for freelance" },
          { value: "limited", label: "Limited availability" },
          { value: "unavailable", label: "Currently booked" },
        ],
      },
      { name: "openTo", label: "Open to", type: "text" },
      { name: "year", label: "Year (footer)", type: "text" },
      { name: "builtWith", label: "Built with (footer)", type: "text" },
    ],
  },
  {
    title: "Social links",
    fields: [
      { name: "social.github", label: "GitHub", type: "url" },
      { name: "social.fiverr", label: "Fiverr", type: "url" },
      { name: "social.upwork", label: "Upwork", type: "url" },
    ],
  },
  {
    title: "Hero & about",
    fields: [
      { name: "hero.lines", label: "Share-image headline lines", type: "list", itemLabel: "Line" },
      { name: "hero.accentLine", label: "Highlighted line (0 = first)", type: "number", min: 0, step: 1 },
      { name: "hero.roles", label: "Share-image roles line", type: "text" },
      { name: "about.intro", label: "About paragraphs", type: "list", itemLabel: "Paragraph", multiline: true, hint: "The first paragraph appears on the home and about cards." },
    ],
  },
  {
    title: "Project requests",
    fields: [
      { name: "inquiryServices", label: "Services clients can pick", type: "list", itemLabel: "Service" },
      { name: "autoReplyMessage", label: "Auto-reply message to clients", type: "textarea", rows: 4 },
    ],
  },
];

export const replySections: FormSection[] = [
  {
    fields: [
      { name: "subject", label: "Subject", type: "text" },
      { name: "body", label: "Message", type: "textarea", rows: 8 },
    ],
  },
];
```

- [ ] **Step 9: Create `src/components/admin/image-field.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageFolder } from "@/components/admin/field-configs";
import type { ImageRef } from "@/lib/db/schemas";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = { id: string; folder: ImageFolder; value: ImageRef | undefined; onChange: (value: ImageRef | undefined) => void };

/** Uploads straight from the browser to ImageKit using a short-lived signature from our server. */
export function ImageField({ id, folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_BYTES) return setError("Images must be 5 MB or smaller.");

    setUploading(true);
    try {
      const authResponse = await fetch("/api/admin/imagekit-auth", { cache: "no-store" });
      if (!authResponse.ok) throw new Error("Your session expired. Sign in again to upload.");
      const auth = (await authResponse.json()) as { token: string; expire: number; signature: string; publicKey: string };

      const body = new FormData();
      body.append("file", file);
      body.append("fileName", file.name);
      body.append("folder", `/portfolio/${folder}`);
      body.append("useUniqueFileName", "true");
      body.append("publicKey", auth.publicKey);
      body.append("signature", auth.signature);
      body.append("expire", String(auth.expire));
      body.append("token", auth.token);

      const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body });
      const data = (await response.json()) as { url?: string; fileId?: string; message?: string };
      if (!response.ok || !data.url || !data.fileId) throw new Error(data.message ?? "Upload failed.");
      onChange({ url: data.url, fileId: data.fileId, alt: value?.alt ?? "" });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-3">
      {value && (
        <div className="flex flex-wrap items-start gap-4">
          <span className="relative block h-28 w-40 overflow-hidden border-2 border-ink bg-paper-muted">
            <Image src={value.url} alt="" fill sizes="160px" className="object-cover" />
          </span>
          <div className="grid min-w-56 flex-1 gap-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-bold">Alt text</span>
              <input
                className="field"
                value={value.alt}
                maxLength={200}
                onChange={(event) => onChange({ ...value, alt: event.target.value })}
                placeholder="Describe the image for screen readers"
              />
            </label>
            <button type="button" className="btn btn-secondary btn-sm justify-self-start" onClick={() => onChange(undefined)}>
              Remove image
            </button>
          </div>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
        className="text-sm"
      />
      {uploading && <p className="meta" role="status">Uploading…</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 10: Create `src/components/admin/field-input.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import type { FieldConfig } from "@/components/admin/field-configs";
import { ImageField } from "@/components/admin/image-field";
import type { ImageRef } from "@/lib/db/schemas";

type Props = { id: string; field: FieldConfig; value: unknown; error?: string; onChange: (value: unknown) => void };

export function FieldInput({ id, field, value, error, onChange }: Props) {
  const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const common = { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined };

  let control: ReactNode;
  switch (field.type) {
    case "text":
    case "email":
    case "url":
      control = (
        <input {...common} type={field.type} className="field" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)} />
      );
      break;
    case "textarea":
      control = (
        <textarea {...common} rows={field.rows ?? 4} className="field" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)} />
      );
      break;
    case "number":
      control = (
        <input
          {...common}
          type="number"
          className="field max-w-40"
          min={field.min}
          max={field.max}
          step={field.step}
          value={typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        />
      );
      break;
    case "toggle":
      control = (
        <input {...common} type="checkbox" className="size-5 accent-[var(--accent)]" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      );
      break;
    case "select":
      control = (
        <select {...common} className="field select" value={(value as string | undefined) ?? ""} onChange={(event) => onChange(event.target.value)}>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
      break;
    case "image":
      control = <ImageField id={id} folder={field.folder} value={value as ImageRef | undefined} onChange={onChange} />;
      break;
    case "list": {
      const items = (value as string[] | undefined) ?? [];
      const set = (next: string[]) => onChange(next);
      control = (
        <div className="grid gap-2" id={id} aria-describedby={describedBy}>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              {field.multiline ? (
                <textarea
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  rows={3}
                  className="field flex-1"
                  value={item}
                  onChange={(event) => set(items.map((current, i) => (i === index ? event.target.value : current)))}
                />
              ) : (
                <input
                  aria-label={`${field.itemLabel} ${index + 1}`}
                  className="field flex-1"
                  value={item}
                  onChange={(event) => set(items.map((current, i) => (i === index ? event.target.value : current)))}
                />
              )}
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remove ${field.itemLabel.toLowerCase()} ${index + 1}`} onClick={() => set(items.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-white btn-sm justify-self-start" onClick={() => set([...items, ""])}>
            Add {field.itemLabel.toLowerCase()}
          </button>
        </div>
      );
      break;
    }
    case "pairs": {
      const [first, second] = field.keys;
      const rows = (value as Record<string, string>[] | undefined) ?? [];
      const set = (next: Record<string, string>[]) => onChange(next);
      const edit = (index: number, key: string, text: string) => set(rows.map((row, i) => (i === index ? { ...row, [key]: text } : row)));
      control = (
        <div className="grid gap-2" id={id} aria-describedby={describedBy}>
          {rows.map((row, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <input aria-label={`${field.keyLabels[0]} ${index + 1}`} placeholder={field.keyLabels[0]} className="field flex-1" value={row[first] ?? ""} onChange={(event) => edit(index, first, event.target.value)} />
              <input aria-label={`${field.keyLabels[1]} ${index + 1}`} placeholder={field.keyLabels[1]} className="field w-32" value={row[second] ?? ""} onChange={(event) => edit(index, second, event.target.value)} />
              <button type="button" className="btn btn-secondary btn-sm" aria-label={`Remove row ${index + 1}`} onClick={() => set(rows.filter((_, i) => i !== index))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-white btn-sm justify-self-start" onClick={() => set([...rows, { [first]: "", [second]: "" }])}>
            Add row
          </button>
        </div>
      );
      break;
    }
  }

  return (
    <div className={field.type === "toggle" ? "flex flex-row-reverse items-center justify-end gap-3" : "grid gap-1.5"}>
      <label htmlFor={id} className="text-sm font-bold">
        {field.label}
      </label>
      {control}
      {field.hint && (
        <p id={`${id}-hint`} className="text-sm text-ink/70">
          {field.hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 11: Create `src/components/admin/entity-form.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import type { FormSection } from "@/components/admin/field-configs";
import { FieldInput } from "@/components/admin/field-input";
import type { ActionResult } from "@/lib/admin/action-result";
import { getPath, setPath } from "@/lib/admin/paths";

type Values = Record<string, unknown>;

type Props = {
  sections: FormSection[];
  initial: Values;
  action: (values: Values) => Promise<ActionResult>;
  submitLabel?: string;
  /** After a successful create, navigate to this prefix + the new id. */
  redirectOnCreate?: string;
  resetOnSuccess?: boolean;
  onDone?: () => void;
};

/** Error for a field, including nested ones like "includes.2" or "metrics.0.value". */
function errorFor(errors: Record<string, string>, name: string) {
  return errors[name] ?? Object.entries(errors).find(([key]) => key.startsWith(`${name}.`))?.[1];
}

export function EntityForm({ sections, initial, action, submitLabel = "Save", redirectOnCreate, resetOnSuccess, onDone }: Props) {
  const router = useRouter();
  const formId = useId();
  const [values, setValues] = useState<Values>(initial);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const response = await action(values).catch((): ActionResult => ({ ok: false, error: "Couldn't reach the server. Try again." }));
      setResult(response);
      if (!response.ok) return;
      if (redirectOnCreate && response.id) return router.push(`${redirectOnCreate}${response.id}`);
      if (resetOnSuccess) setValues(initial);
      router.refresh();
      onDone?.();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8">
      {sections.map((section, index) => (
        <fieldset key={section.title ?? index} className="grid gap-5">
          {section.title && <legend className="meta mb-4 font-bold">{section.title}</legend>}
          {section.fields.map((field) => (
            <FieldInput
              key={field.name}
              id={`${formId}-${field.name}`}
              field={field}
              value={getPath(values, field.name)}
              error={errorFor(errors, field.name)}
              onChange={(value) => setValues((current) => setPath(current, field.name, value))}
            />
          ))}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-accent" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {onDone && (
          <button type="button" className="btn btn-secondary" onClick={onDone} disabled={pending}>
            Cancel
          </button>
        )}
        {result && !result.ok && (
          <p role="alert" className="field-error">
            {result.error}
          </p>
        )}
        {result?.ok && !pending && (
          <p role="status" className="meta font-bold">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
```

- [ ] **Step 12: Create `src/components/admin/ordered-list-editor.tsx`**

```tsx
"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EntityForm } from "@/components/admin/entity-form";
import type { FormSection } from "@/components/admin/field-configs";
import { cardClass } from "@/components/ui/card";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/cn";

type Values = Record<string, unknown>;

type Props = {
  items: { id: string; values: Values }[];
  sections: FormSection[];
  empty: Values;
  titleField: string;
  subtitleField?: string;
  noun: string;
  create: (values: Values) => Promise<ActionResult>;
  update: (id: string, values: Values) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
  move: (id: string, direction: "up" | "down") => Promise<ActionResult>;
};

/** Inline add / edit / delete / reorder for a small ordered collection. */
export function OrderedListEditor({ items, sections, empty, titleField, subtitleField, noun, create, update, remove, move }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    setError("");
    startTransition(async () => {
      const result = await task().catch((): ActionResult => ({ ok: false, error: "Couldn't reach the server." }));
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-4">
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}

      {items.length === 0 && <p className="text-ink/70">No {noun}s yet.</p>}

      <ol className="grid gap-4">
        {items.map((item, index) => (
          <li key={item.id} className={cn(cardClass("white"), "p-4 sm:p-5")}>
            {editing === item.id ? (
              <EntityForm
                sections={sections}
                initial={item.values}
                action={(values) => update(item.id, values)}
                onDone={() => setEditing(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{String(item.values[titleField] ?? "")}</p>
                  {subtitleField && <p className="text-sm text-ink/70">{String(item.values[subtitleField] ?? "")}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="icon-btn bg-white" aria-label={`Move ${noun} up`} disabled={pending || index === 0} onClick={() => run(() => move(item.id, "up"))}>
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn bg-white" aria-label={`Move ${noun} down`} disabled={pending || index === items.length - 1} onClick={() => run(() => move(item.id, "down"))}>
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button type="button" className="icon-btn bg-tint" aria-label={`Edit ${noun}`} onClick={() => setEditing(item.id)}>
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn bg-accent"
                    aria-label={`Delete ${noun}`}
                    disabled={pending}
                    onClick={() => window.confirm(`Delete this ${noun}? This can't be undone.`) && run(() => remove(item.id))}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      {editing === "new" ? (
        <div className={cn(cardClass("tint"), "p-4 sm:p-5")}>
          <EntityForm sections={sections} initial={empty} action={create} submitLabel={`Add ${noun}`} resetOnSuccess onDone={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" className="btn btn-primary justify-self-start" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Add {noun}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 13: Create `src/components/admin/admin-nav.tsx`**

```tsx
"use client";

import {
  BriefcaseBusiness,
  Cpu,
  Footprints,
  Inbox,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquareQuote,
  Settings,
  UserRound,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/(panel)/actions";

const links: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/admin/projects", label: "Projects", icon: BriefcaseBusiness },
  { href: "/admin/services", label: "Services", icon: Layers },
  { href: "/admin/process", label: "Process", icon: Waypoints },
  { href: "/admin/experience", label: "Experience", icon: Footprints },
  { href: "/admin/stack", label: "Tech stack", icon: Cpu },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/account", label: "Account", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ email, newInquiries }: { email: string; newInquiries: number }) {
  const pathname = usePathname();

  return (
    <header className="px-2 py-4 text-on-frame sm:px-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:self-start lg:px-5 lg:py-7">
      <p className="title text-xl">Admin</p>
      <p className="meta mt-1 truncate">{email}</p>
      <nav aria-label="Admin" className="mt-6 lg:mt-10">
        <ul className="flex gap-1.5 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href} className="shrink-0">
              <Link href={href} className="side-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
                <Icon aria-hidden="true" />
                {label}
                {href === "/admin/inquiries" && newInquiries > 0 && (
                  <span className="ml-auto border-2 border-ink bg-accent px-1.5 font-mono text-xs font-bold text-ink">{newInquiries}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-4 flex gap-2 lg:mt-auto lg:grid">
        <Link href="/" className="side-link" target="_blank">
          View site ↗
        </Link>
        <form action={logout}>
          <button type="submit" className="side-link w-full">
            <LogOut aria-hidden="true" />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
```

- [ ] **Step 14: Create `src/app/admin/(panel)/layout.tsx`**

```tsx
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
```

- [ ] **Step 15: Create the dashboard `src/app/admin/(panel)/page.tsx`**

```tsx
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
```

- [ ] **Step 16: Verify** — `npm run typecheck && npm run lint && npm test`. In `npm run dev`, sign in: the dashboard shows counts matching the seeded data; the nav highlights "Dashboard"; "Sign out" returns to `/admin/login`, and `/admin` then redirects to login again. Resize to 375px wide: nav scrolls horizontally, no page-level horizontal scroll.

- [ ] **Step 17: Commit**

```bash
git add src/lib/admin src/components/admin "src/app/admin/(panel)"
git commit -m "feat(admin): form kit, list editor, panel shell and dashboard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Settings and account pages

**Files:**
- Create: `src/app/admin/(panel)/settings/page.tsx`, `src/app/admin/(panel)/settings/actions.ts`, `src/app/admin/(panel)/account/page.tsx`, `src/app/admin/(panel)/account/actions.ts`, `src/app/admin/(panel)/account/password-form.tsx`

**Interfaces:**
- Consumes: `EntityForm`, `settingsSections` (Task 8); `settingsSchema`, `passwordChangeSchema` (Task 1); `findSettings`, `saveSettings`, `findAdminById`, `updatePassword` (Task 2); `hashPassword`, `verifyPassword` (Task 3); `requireAdmin`, `setSessionCookie` (Task 5); `deleteReplacedImages` (Task 7); `invalid`, `fromDbError`, `refresh` (Task 8).
- Produces: server actions `saveSettingsAction(input: unknown): Promise<ActionResult>`, `changePassword(state, formData): Promise<PasswordState>`.

- [ ] **Step 1: Create `src/app/admin/(panel)/settings/actions.ts`**

```ts
"use server";

import { fromDbError, invalid, type ActionResult } from "@/lib/admin/action-result";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import { settingsSchema } from "@/lib/db/schemas";
import { saveSettings } from "@/lib/db/settings";
import { deleteReplacedImages } from "@/lib/imagekit";

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const previous = await saveSettings(parsed.data);
    await deleteReplacedImages([previous?.portrait], [parsed.data.portrait]);
    refresh("settings");
    return { ok: true };
  } catch (error) {
    return fromDbError(error);
  }
}
```

- [ ] **Step 2: Create `src/app/admin/(panel)/settings/page.tsx`**

```tsx
import { EntityForm } from "@/components/admin/entity-form";
import { settingsSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { saveSettingsAction } from "@/app/admin/(panel)/settings/actions";
import { requireAdmin } from "@/lib/auth/dal";
import { findSettings } from "@/lib/db/settings";

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await findSettings();

  return (
    <>
      <PageTitle>Settings</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Profile, contact details and site-wide text. Changes appear on the live site right after saving.</p>
      <Card className="mt-8 p-5 sm:p-6">
        {settings ? (
          <EntityForm sections={settingsSections} initial={settings} action={saveSettingsAction} submitLabel="Save settings" />
        ) : (
          <p>
            No settings found. Run <code className="font-mono">npm run db:seed</code> first.
          </p>
        )}
      </Card>
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/(panel)/account/actions.ts`**

```ts
"use server";

import { invalid } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/auth/dal";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session-cookie";
import { findAdminById, updatePassword } from "@/lib/db/admins";
import { passwordChangeSchema } from "@/lib/db/schemas";

export type PasswordState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

/** Changing the password bumps sessionVersion, which signs out every other session; this one gets a fresh cookie. */
export async function changePassword(_state: PasswordState, formData: FormData): Promise<PasswordState> {
  const admin = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const result = invalid(parsed.error);
    return result.ok ? undefined : { error: result.error, fieldErrors: result.fieldErrors };
  }

  const record = await findAdminById(admin.id);
  if (!record || !(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { error: "Password not changed.", fieldErrors: { current: "Current password is incorrect." } };
  }

  const sessionVersion = await updatePassword(admin.id, await hashPassword(parsed.data.next));
  if (sessionVersion === null) return { error: "Password not changed." };
  await setSessionCookie({ adminId: admin.id, sessionVersion });
  return { ok: true };
}
```

- [ ] **Step 4: Create `src/app/admin/(panel)/account/password-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/admin/(panel)/account/actions";

const fields = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  { name: "next", label: "New password (12+ characters)", autoComplete: "new-password" },
  { name: "confirm", label: "Repeat new password", autoComplete: "new-password" },
] as const;

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} className="grid max-w-md gap-4" noValidate>
      {fields.map((field) => {
        const error = state?.fieldErrors?.[field.name];
        return (
          <label key={field.name} className="grid gap-1.5">
            <span className="text-sm font-bold">{field.label}</span>
            <input name={field.name} type="password" autoComplete={field.autoComplete} className="field" aria-invalid={error ? true : undefined} />
            {error && <span className="field-error">{error}</span>}
          </label>
        );
      })}
      {state?.error && (
        <p role="alert" className="field-error">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="meta font-bold">
          Password changed. Other devices have been signed out.
        </p>
      )}
      <button type="submit" className="btn btn-accent justify-self-start" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/(panel)/account/page.tsx`**

```tsx
import { PasswordForm } from "@/app/admin/(panel)/account/password-form";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";

export default async function AccountPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageTitle>Account</PageTitle>
      <p className="mt-4 text-ink/80">Signed in as {admin.email}.</p>
      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="meta mb-5 font-bold">Change password</h2>
        <PasswordForm />
      </Card>
    </>
  );
}
```

- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint`. In `npm run dev`:
  - Settings: change "Brand" to `AnbuDev Test`, save → "Saved."; open `/` in another tab → the logo and browser tab show `AnbuDev Test`. Change it back.
  - Clear "Your name", save → field error under "Your name", other values kept.
  - Set "Highlighted line" to 9 → error "Pick a line that exists (0 = first line)."
  - Upload a portrait (needs ImageKit env) → preview appears; save; `/` shows the portrait. Upload a different one and save → the first file disappears from the ImageKit media library.
  - Account: wrong current password → "Current password is incorrect."; valid change → success message. A second browser that was signed in is sent to the login page on its next click.

- [ ] **Step 7: Commit**

```bash
git add "src/app/admin/(panel)/settings" "src/app/admin/(panel)/account"
git commit -m "feat(admin): settings editor and password change

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Services, process, experience, stack and testimonials editors

**Files:**
- Create: `src/app/admin/(panel)/{services,process,experience,stack,testimonials}/actions.ts` and `page.tsx` (10 files)

**Interfaces:**
- Consumes: `collectionActions` (Task 8), `repos` (Task 2), schemas (Task 1), `OrderedListEditor`, section configs, `emptyValues` (Task 8), `requireAdmin` (Task 5).
- Produces: server actions `create*/update*/delete*/move*` for each collection (names below).

- [ ] **Step 1: Create `src/app/admin/(panel)/services/actions.ts`**

```ts
"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { serviceSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.services, schema: serviceSchema, tags: ["services"] });

export async function createService(input: unknown) {
  return actions.create(input);
}
export async function updateService(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteService(id: string) {
  return actions.remove(id);
}
export async function moveService(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
```

- [ ] **Step 2: Create `src/app/admin/(panel)/services/page.tsx`**

```tsx
import { createService, deleteService, moveService, updateService } from "@/app/admin/(panel)/services/actions";
import { emptyValues, serviceSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ServicesAdminPage() {
  await requireAdmin();
  const items = (await repos.services.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Services</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Shown on the Services page and counted on the home page. Order here is the order on the site.</p>
      <OrderedListEditor
        items={items}
        sections={serviceSections}
        empty={emptyValues(serviceSections)}
        titleField="title"
        subtitleField="description"
        noun="service"
        create={createService}
        update={updateService}
        remove={deleteService}
        move={moveService}
      />
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/(panel)/process/actions.ts`**

```ts
"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { processStepSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.processSteps, schema: processStepSchema, tags: ["process"] });

export async function createProcessStep(input: unknown) {
  return actions.create(input);
}
export async function updateProcessStep(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteProcessStep(id: string) {
  return actions.remove(id);
}
export async function moveProcessStep(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
```

- [ ] **Step 4: Create `src/app/admin/(panel)/process/page.tsx`**

```tsx
import { createProcessStep, deleteProcessStep, moveProcessStep, updateProcessStep } from "@/app/admin/(panel)/process/actions";
import { emptyValues, processSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ProcessAdminPage() {
  await requireAdmin();
  const items = (await repos.processSteps.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>How I work</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">The process steps on the Services page.</p>
      <OrderedListEditor
        items={items}
        sections={processSections}
        empty={emptyValues(processSections)}
        titleField="title"
        subtitleField="description"
        noun="step"
        create={createProcessStep}
        update={updateProcessStep}
        remove={deleteProcessStep}
        move={moveProcessStep}
      />
    </>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/(panel)/experience/actions.ts`**

```ts
"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { experienceSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.experience, schema: experienceSchema, tags: ["experience"] });

export async function createExperience(input: unknown) {
  return actions.create(input);
}
export async function updateExperience(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteExperience(id: string) {
  return actions.remove(id);
}
export async function moveExperience(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
```

- [ ] **Step 6: Create `src/app/admin/(panel)/experience/page.tsx`**

```tsx
import { createExperience, deleteExperience, moveExperience, updateExperience } from "@/app/admin/(panel)/experience/actions";
import { emptyValues, experienceSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ExperienceAdminPage() {
  await requireAdmin();
  const items = (await repos.experience.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Experience</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Most recent first. Delete every entry and the About page hides the section.</p>
      <OrderedListEditor
        items={items}
        sections={experienceSections}
        empty={emptyValues(experienceSections)}
        titleField="role"
        subtitleField="company"
        noun="role"
        create={createExperience}
        update={updateExperience}
        remove={deleteExperience}
        move={moveExperience}
      />
    </>
  );
}
```

- [ ] **Step 7: Create `src/app/admin/(panel)/stack/actions.ts`**

```ts
"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { stackGroupSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.stackGroups, schema: stackGroupSchema, tags: ["stack"] });

export async function createStackGroup(input: unknown) {
  return actions.create(input);
}
export async function updateStackGroup(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteStackGroup(id: string) {
  return actions.remove(id);
}
export async function moveStackGroup(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
```

- [ ] **Step 8: Create `src/app/admin/(panel)/stack/page.tsx`**

```tsx
import { createStackGroup, deleteStackGroup, moveStackGroup, updateStackGroup } from "@/app/admin/(panel)/stack/actions";
import { emptyValues, stackSections } from "@/components/admin/field-configs";
import { OrderedListEditor } from "@/components/admin/ordered-list-editor";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function StackAdminPage() {
  await requireAdmin();
  const items = (await repos.stackGroups.list()).map(({ id, ...values }) => ({ id, values }));

  return (
    <>
      <PageTitle>Tech stack</PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">
        Groups on the About page. Names with a known brand logo (React, Next.js, MongoDB…) show the logo; others show a wordmark.
      </p>
      <OrderedListEditor
        items={items}
        sections={stackSections}
        empty={emptyValues(stackSections)}
        titleField="label"
        noun="group"
        create={createStackGroup}
        update={updateStackGroup}
        remove={deleteStackGroup}
        move={moveStackGroup}
      />
    </>
  );
}
```

- [ ] **Step 9: Create `src/app/admin/(panel)/testimonials/actions.ts`**

```ts
"use server";

import { collectionActions } from "@/lib/admin/collection-actions";
import { repos } from "@/lib/db/repos";
import { testimonialSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.testimonials, schema: testimonialSchema, tags: ["testimonials"], imageFields: ["avatar"] });

export async function createTestimonial(input: unknown) {
  return actions.create(input);
}
export async function updateTestimonial(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteTestimonial(id: string) {
  return actions.remove(id);
}
export async function moveTestimonial(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}
```

- [ ] **Step 10: Create `src/app/admin/(panel)/testimonials/page.tsx`**

```tsx
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
```

- [ ] **Step 11: Verify** — `npm run typecheck && npm run lint && npm test`. In `npm run dev`, for each of Services, Process, Experience, Stack, Testimonials:
  - Add an item → it appears at the bottom; the matching public page shows it after a reload.
  - Edit it, move it up, delete it (confirm dialog) → the public page follows each change.
  - Save with a required field empty → inline field error, nothing saved.
  - Testimonials: untick "Show on the site" → hidden on `/`; unpublish all → the reviews section disappears. Upload an avatar → shown on the review card.

- [ ] **Step 12: Commit**

```bash
git add "src/app/admin/(panel)"
git commit -m "feat(admin): editors for services, process, experience, stack and testimonials

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Projects

**Files:**
- Create: `src/app/admin/(panel)/projects/actions.ts`, `src/app/admin/(panel)/projects/page.tsx`, `src/app/admin/(panel)/projects/project-list.tsx`, `src/app/admin/(panel)/projects/new/page.tsx`, `src/app/admin/(panel)/projects/[id]/page.tsx`, `src/app/admin/(panel)/not-found.tsx`

**Interfaces:**
- Consumes: `collectionActions`, `failed`, `refresh`, `EntityForm`, `projectSections`, `emptyValues` (Task 8); `repos` (Task 2); `projectSchema` (Task 1); `requireAdmin` (Task 5).
- Produces: `createProject`, `updateProject(id, input)`, `deleteProject(id)`, `moveProject(id, direction)`, `setProjectFeatured(id, featured)`.

- [ ] **Step 1: Create `src/app/admin/(panel)/projects/actions.ts`**

```ts
"use server";

import { failed, type ActionResult } from "@/lib/admin/action-result";
import { collectionActions } from "@/lib/admin/collection-actions";
import { refresh } from "@/lib/admin/refresh";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";
import { projectSchema } from "@/lib/db/schemas";

const actions = collectionActions({ repo: repos.projects, schema: projectSchema, tags: ["projects"], imageFields: ["image"] });

export async function createProject(input: unknown) {
  return actions.create(input);
}
export async function updateProject(id: string, input: unknown) {
  return actions.update(id, input);
}
export async function deleteProject(id: string) {
  return actions.remove(id);
}
export async function moveProject(id: string, direction: "up" | "down") {
  return actions.move(id, direction);
}

export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (typeof featured !== "boolean") return failed();
  if (!(await repos.projects.patch(id, { featured }))) return failed("This project no longer exists. Reload the page.");
  refresh("projects");
  return { ok: true };
}
```

- [ ] **Step 2: Create `src/app/admin/(panel)/projects/project-list.tsx`**

```tsx
"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProject, moveProject, setProjectFeatured } from "@/app/admin/(panel)/projects/actions";
import { cardClass } from "@/components/ui/card";
import type { ActionResult } from "@/lib/admin/action-result";
import { cn } from "@/lib/cn";

type Row = { id: string; title: string; slug: string; category: string[]; featured: boolean };

export function ProjectList({ projects }: { projects: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    setError("");
    startTransition(async () => {
      const result = await task().catch((): ActionResult => ({ ok: false, error: "Couldn't reach the server." }));
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 grid gap-4">
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      {projects.length === 0 && <p className="text-ink/70">No projects yet.</p>}
      <ol className="grid gap-4">
        {projects.map((project, index) => (
          <li key={project.id} className={cn(cardClass("white"), "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{project.title}</p>
              <p className="meta text-ink/70">
                /work/{project.slug} · {project.category.join(" / ")}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={project.featured}
                disabled={pending}
                onChange={(event) => run(() => setProjectFeatured(project.id, event.target.checked))}
              />
              Featured
            </label>
            <div className="flex gap-2">
              <button type="button" className="icon-btn bg-white" aria-label={`Move ${project.title} up`} disabled={pending || index === 0} onClick={() => run(() => moveProject(project.id, "up"))}>
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-btn bg-white"
                aria-label={`Move ${project.title} down`}
                disabled={pending || index === projects.length - 1}
                onClick={() => run(() => moveProject(project.id, "down"))}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <Link href={`/admin/projects/${project.id}`} className="icon-btn bg-tint" aria-label={`Edit ${project.title}`}>
                <Pencil aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="icon-btn bg-accent"
                aria-label={`Delete ${project.title}`}
                disabled={pending}
                onClick={() => window.confirm(`Delete “${project.title}”? This can't be undone.`) && run(() => deleteProject(project.id))}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/admin/(panel)/projects/page.tsx`**

```tsx
import { Plus } from "lucide-react";
import { ProjectList } from "@/app/admin/(panel)/projects/project-list";
import { ButtonLink } from "@/components/ui/button-link";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

export default async function ProjectsAdminPage() {
  await requireAdmin();
  const projects = (await repos.projects.list()).map(({ id, title, slug, category, featured }) => ({ id, title, slug, category, featured }));

  return (
    <>
      <PageTitle
        action={
          <ButtonLink href="/admin/projects/new" variant="accent" size="sm" icon={<Plus />}>
            Add project
          </ButtonLink>
        }
      >
        Projects
      </PageTitle>
      <p className="mt-4 max-w-[60ch] text-ink/80">Order here is the order on /work. Featured projects also appear on the home page.</p>
      <ProjectList projects={projects} />
    </>
  );
}
```

- [ ] **Step 4: Create `src/app/admin/(panel)/projects/new/page.tsx`**

```tsx
import { createProject } from "@/app/admin/(panel)/projects/actions";
import { EntityForm } from "@/components/admin/entity-form";
import { emptyValues, projectSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <>
      <PageTitle eyebrow="Projects">New project</PageTitle>
      <Card className="mt-8 p-5 sm:p-6">
        <EntityForm sections={projectSections} initial={emptyValues(projectSections)} action={createProject} submitLabel="Create project" redirectOnCreate="/admin/projects/" />
      </Card>
    </>
  );
}
```

- [ ] **Step 5: Create `src/app/admin/(panel)/projects/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { updateProject } from "@/app/admin/(panel)/projects/actions";
import { EntityForm } from "@/components/admin/entity-form";
import { projectSections } from "@/components/admin/field-configs";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { requireAdmin } from "@/lib/auth/dal";
import { repos } from "@/lib/db/repos";

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const project = await repos.projects.get(id);
  if (!project) notFound();

  return (
    <>
      <PageTitle eyebrow="Edit project">{project.title}</PageTitle>
      <Card className="mt-8 p-5 sm:p-6">
        <EntityForm sections={projectSections} initial={project} action={updateProject.bind(null, id)} submitLabel="Save project" />
      </Card>
    </>
  );
}
```

- [ ] **Step 6: Create `src/app/admin/(panel)/not-found.tsx`** (keeps admin 404s inside the admin shell)

```tsx
import { ButtonLink } from "@/components/ui/button-link";
import { PageTitle } from "@/components/ui/page-title";

export default function AdminNotFound() {
  return (
    <>
      <PageTitle eyebrow="(404)">Not found</PageTitle>
      <p className="mt-4 text-ink/80">It may have been deleted.</p>
      <ButtonLink href="/admin" className="mt-6">
        Back to dashboard
      </ButtonLink>
    </>
  );
}
```

- [ ] **Step 7: Verify** — `npm run typecheck && npm run lint && npm test`. In `npm run dev`:
  - "Add project" → fill title, slug `test-project`, description, year, one category, one technology → "Create project" lands on `/admin/projects/<id>`; `/work` lists it; `/work/test-project` renders the case study.
  - Create another with slug `test-project` → "Already in use." under the slug field.
  - Upload a cover image, save → `/work` card shows it. Replace it → old file gone from ImageKit.
  - Clear "Client" on a project that has one, save → the "Client" row disappears from the case study (Review Focus 2).
  - Toggle Featured → the home page "Selected work" list follows. Reorder → `/work` order and "01/02" numbers follow.
  - Delete `test-project` → `/work/test-project` shows the 404 page (Review Focus 1); `/admin/projects/<old id>` shows the admin 404.

- [ ] **Step 8: Commit**

```bash
git add "src/app/admin/(panel)"
git commit -m "feat(admin): project list, create and edit

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Inquiries inbox and replies

**Files:**
- Create: `src/lib/admin/format.ts`, `src/app/admin/(panel)/inquiries/actions.ts`, `src/app/admin/(panel)/inquiries/page.tsx`, `src/app/admin/(panel)/inquiries/[id]/page.tsx`, `src/app/admin/(panel)/inquiries/[id]/status-select.tsx`

**Interfaces:**
- Consumes: `listInquiries`, `getInquiry`, `setInquiryStatus`, `addReply` (Task 2); `inquiryStatuses`, `replySchema` (Task 1); `findSettings` (Task 2); `sendEmail` (Task 6); `EntityForm`, `replySections`, `invalid`, `failed` (Task 8); `requireAdmin` (Task 5).
- Produces: `statusLabels`, `formatDate(iso)`; server actions `updateInquiryStatus(id, status)`, `sendReply(id, input)`.

- [ ] **Step 1: Create `src/lib/admin/format.ts`**

```ts
import type { InquiryStatus } from "@/lib/db/schemas";

export const statusLabels: Record<InquiryStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
```

- [ ] **Step 2: Create `src/app/admin/(panel)/inquiries/actions.ts`**

```ts
"use server";

import { failed, invalid, type ActionResult } from "@/lib/admin/action-result";
import { requireAdmin } from "@/lib/auth/dal";
import { addReply, getInquiry, setInquiryStatus } from "@/lib/db/inquiries";
import { inquiryStatuses, replySchema, type InquiryStatus } from "@/lib/db/schemas";
import { findSettings } from "@/lib/db/settings";
import { sendEmail } from "@/lib/mail";

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<ActionResult> {
  await requireAdmin();
  if (!inquiryStatuses.includes(status)) return failed();
  if (!(await setInquiryStatus(id, status))) return failed("This request no longer exists.");
  return { ok: true };
}

/** Emails the client through Resend and records the reply, delivered or not. */
export async function sendReply(id: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const [inquiry, settings] = await Promise.all([getInquiry(id), findSettings()]);
  if (!inquiry) return failed("This request no longer exists.");

  const delivered = await sendEmail({ to: inquiry.email, subject: parsed.data.subject, text: parsed.data.body, replyTo: settings?.email });
  await addReply(id, { ...parsed.data, delivered });

  return delivered ? { ok: true } : failed("The email could not be sent. The reply was saved as “not delivered” — try again in a moment.");
}
```

- [ ] **Step 3: Create `src/app/admin/(panel)/inquiries/page.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `src/app/admin/(panel)/inquiries/[id]/status-select.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateInquiryStatus } from "@/app/admin/(panel)/inquiries/actions";
import { statusLabels } from "@/lib/admin/format";
import { inquiryStatuses, type InquiryStatus } from "@/lib/db/schemas";

export function StatusSelect({ id, status }: { id: string; status: InquiryStatus }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 grid gap-2">
      <label htmlFor="inquiry-status" className="sr-only">
        Status
      </label>
      <select
        id="inquiry-status"
        className="field select"
        defaultValue={status}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as InquiryStatus;
          setError("");
          startTransition(async () => {
            const result = await updateInquiryStatus(id, next);
            if (!result.ok) setError(result.error);
            router.refresh();
          });
        }}
      >
        {inquiryStatuses.map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
```

Note: `inquiryStatuses` comes from `@/lib/db/schemas`, which imports only `zod` — safe in a client component.

- [ ] **Step 5: Create `src/app/admin/(panel)/inquiries/[id]/page.tsx`**

```tsx
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
```

- [ ] **Step 6: Verify** — `npm run typecheck && npm run lint && npm test`. In `npm run dev`:
  - Submit a request on the public site → the admin nav badge shows 1; the inbox lists it highlighted as New.
  - Open it → status becomes Read, badge clears; phone, WhatsApp and email links work.
  - Send a reply (without `RESEND_API_KEY` it is logged in the terminal) → it appears under Replies as "Sent"; status becomes Replied.
  - With `RESEND_API_KEY=re_invalid` set → sending shows the "could not be sent" error and the reply is listed as "Not delivered".
  - Filters (All/New/Read/Replied/Archived) show the right rows; setting Archived moves it out of New.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/format.ts "src/app/admin/(panel)/inquiries"
git commit -m "feat(admin): inquiries inbox with status and Resend replies

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Documentation and end-to-end verification

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-09-27-admin-panel-design.md` (only if implementation deviated)

- [ ] **Step 1: Add an "Admin panel" section to `README.md`**

```markdown
## Admin panel

Content (profile, projects, services, process, experience, stack, testimonials) lives in MongoDB and is edited at `/admin`.
Project requests from the "Start project" form are stored in MongoDB, emailed to you, auto-acknowledged to the client, and can be answered from `/admin/inquiries`.

### First-time setup

1. Copy `.env.example` to `.env.local` and fill in every value:
   - `MONGODB_URI`, `MONGODB_DB` — a MongoDB Atlas cluster (the free tier is fine) or a local `mongod`.
   - `SESSION_SECRET` — 32+ random characters, e.g. `openssl rand -base64 48`.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters) — only read by the script below; remove the password afterwards.
   - `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` — ImageKit dashboard → Developer options.
   - `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — `CONTACT_FROM_EMAIL` must use a domain verified in Resend, otherwise Resend only delivers to your own address.
2. `npm run db:seed` — imports the original site content (safe to re-run; it skips collections that already have data).
3. `npm run admin:create` — creates the admin account (re-run it to reset a forgotten password; this signs out every session).
4. `npm run dev` and sign in at `/admin/login`.

### Notes

- `npm run build` reads from MongoDB, so the build environment needs `MONGODB_URI` too.
- Saving in the admin refreshes the affected public pages immediately; no redeploy needed.
- Using a custom ImageKit domain? Add it to `images.remotePatterns` in `next.config.ts`.
- `npm test` runs the unit and repository tests against an in-memory MongoDB (the first run downloads a MongoDB binary).
```

- [ ] **Step 2: Full check**

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Expected: all pass. Paste the summary lines (test count, build route table) into the task report.

- [ ] **Step 3: Browser click-through with Playwright** (against `npm run start` after the build, with real MongoDB and ImageKit keys; Resend may stay unset so emails are logged)

1. `/admin` → redirected to `/admin/login`. Wrong password → error. Correct → dashboard.
2. Settings: change availability to "Currently booked" → public sidebar and top bar say "Currently booked". Revert.
3. Projects: create, upload a cover, feature it, reorder, edit, delete — public `/`, `/work` and `/work/<slug>` follow each step.
4. Services, Process, Experience, Stack, Testimonials: add, edit, reorder and delete one item each — the public page follows.
5. Public site: submit "Start project" with all five steps → success screen; admin inbox shows the request; reply to it.
6. Account: change the password; sign out; sign in with the new one.
7. Resize to 375px: admin and public pages have no horizontal page scroll.
8. Take screenshots of the dashboard, a project form and the inbox for the final report.

- [ ] **Step 4: Update the spec if anything deviated** (for example, images are served via `next/image` optimisation of the ImageKit original instead of ImageKit URL transformations), then commit

```bash
git add README.md docs/superpowers/specs/2026-09-27-admin-panel-design.md
git commit -m "docs: admin panel setup and operations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Hand off** — use superpowers:finishing-a-development-branch to decide how to integrate `feature/admin-panel`.
