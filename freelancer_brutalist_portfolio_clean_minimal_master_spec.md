# Freelancer Portfolio — Clean Brutalist 2026

## Master Design & Engineering Specification

> Build a clean, minimal, premium freelancer portfolio with a controlled brutalist aesthetic. It must feel like a carefully art-directed personal website — **NOT** an operating system, dashboard, terminal, or chaotic anti-design experiment.

## 1. Design North Star

**Target feeling:**

CLEAN + MINIMAL + BOLD + EDITORIAL + BRUTALIST + HUMAN + MEMORABLE

The site should use:
- oversized typography
- hard black borders
- warm paper-like backgrounds
- restrained accent colors
- generous whitespace
- intentional asymmetry
- strong project presentation
- subtle, purposeful motion

Avoid:
- dashboard/OS layouts
- permanent sidebars
- excessive cards
- glassmorphism
- gradients
- excessive rounded corners
- fake UI controls
- excessive animation
- random rotations
- visual clutter
- generic portfolio templates

**Core rule:** If removing an element makes the page clearer without reducing personality, remove it.

---

## 2. Visual Reference

Use the supplied reference only for its visual language:
- warm/off-white surfaces
- bold typography
- black borders
- strong contrast
- structured composition
- yellow/accent color

Do NOT copy its dashboard/sidebar/card structure.

The final site must be an original editorial portfolio.

---

## 3. Brutalism Intensity

Default direction: **LOUD, but controlled.**

Use approximately:

- 70% clean/minimal
- 20% brutalist tension
- 10% experimentation

The website should feel bold at first glance but calm and easy to read.

Optional feature:

```text
HOW LOUD?
Brutalist either way.

[ RESTRAINED ] [ LOUD ] [ CHAOTIC ]
```

Default: **LOUD**.

If this setting creates unnecessary complexity, omit it. Do not create three completely different themes.

---

## 4. Information Architecture

Routes:

```text
/
 /work
 /work/[slug]
 /about
 /services
 /contact
 /resume (optional)
```

Navigation:

```text
VECNA.DEV

WORK   ABOUT   SERVICES   CONTACT

AVAILABLE ●
```

Mobile:

```text
VECNA.DEV                         MENU
```

Keep navigation simple. Never turn it into a dashboard.

---

## 5. Responsive Strategy

Use **three breakpoints**, implemented mobile-first with fluid CSS.

```text
Mobile:  < 640px
Tablet:  640px–1024px
Desktop: > 1024px
```

Grid:

```text
Mobile  = 4 columns
Tablet  = 8 columns
Desktop = 12 columns
```

Use `clamp()`, CSS Grid, Flexbox, `min()`, and `max()` for fluid sizing.

Test:

```text
320px
375px
390px
640px
768px
1024px
1280px
1440px
1920px
```

Requirements:
- no horizontal overflow
- no hover-only functionality
- mobile is a first-class design
- typography scales fluidly
- tablet gets its own composition rather than simply being enlarged mobile

---

## 6. Color System

Primary palette:

```text
Paper:   #F4F0E7
Ink:     #111111
Muted:   #DCD7CC
Accent:  #DFFF00
Orange:  #FF5C35 (optional)
```

Default rule:

**Paper + Ink + ONE accent.**

Do not use every accent simultaneously.

---

## 7. Borders / Shadows / Radius

Primary border:

```text
2px solid #111111
```

Major frame:

```text
3px solid #111111
```

Optional hard shadow:

```text
5px 5px 0 #111111
```

Use shadows selectively.

Radius:

```text
0px default
2–4px maximum
```

Avoid modern pill-shaped SaaS UI.

---

## 8. Typography

Recommended:

```text
Display: Space Grotesk
Alternative: Geist / Archivo / IBM Plex Sans

Mono: Geist Mono / IBM Plex Mono / JetBrains Mono
```

Hero:

```css
font-size: clamp(4rem, 10vw, 10rem);
line-height: 0.9;
```

Section headings:

```css
font-size: clamp(3rem, 7vw, 7rem);
```

Project titles:

```css
font-size: clamp(2rem, 5vw, 5rem);
```

Body:

```text
16–20px
```

Metadata:

```text
12–14px
```

Use monospace for labels, years, categories, and technical metadata.

---

## 9. Home Page

Structure:

```text
HEADER
↓
HERO
↓
SELECTED WORK
↓
SERVICES
↓
ABOUT
↓
CONTACT CTA
↓
FOOTER
```

Do not add unnecessary sections.

---

## 10. Hero

Do NOT use a normal centered portfolio hero.

Use large editorial typography:

```text
I BUILD
DIGITAL
PRODUCTS.

FULL-STACK DEVELOPER / UI / AI

[ VIEW WORK ↓ ]     [ START A PROJECT ↗ ]

INDIA / REMOTE
AVAILABLE FOR FREELANCE
2026
```

Hero requirements:
- headline dominates
- supporting copy is short
- CTA visible immediately
- no huge profile image
- no generic stock image
- no excessive badges
- no excessive animation

Optional portrait should be an editorial detail, not the main visual.

---

## 11. Selected Work

This is the primary portfolio section.

Title:

```text
SELECTED WORK
```

Do NOT use a generic 3-column card grid.

Use large editorial project rows:

```text
01

LMS PLATFORM

Learning platform for structured online education.

REACT / DJANGO / POSTGRESQL

2026                              VIEW CASE →
```

Desktop can use asymmetric columns:

```text
title/description = 5 columns
metadata = 3 columns
image = 7 columns
```

Intentional overlap is allowed, but every irregularity must remain aligned to the underlying grid.

---

## 12. Project Interaction

Desktop hover:
- image slightly enlarges
- title shifts 2–4px
- arrow moves
- metadata becomes more prominent
- optional contextual cursor says `VIEW ↗`

Mobile:
- no hover dependency
- image always visible
- title, description, tech, and link always accessible

Motion must be subtle.

---

## 13. Project Case Study

Route:

```text
/work/[slug]
```

Structure:

```text
PROJECT HEADER
↓
HERO IMAGE
↓
OVERVIEW
↓
PROBLEM
↓
APPROACH
↓
FEATURES
↓
DESIGN / ENGINEERING
↓
RESULT
↓
TECH STACK
↓
LIVE PROJECT
↓
NEXT PROJECT
```

Example header:

```text
01 / 2026

LMS PLATFORM

A scalable learning platform built
for structured online education.

ROLE
FULL-STACK DEVELOPMENT

STACK
NEXT.JS / DJANGO / POSTGRESQL
```

Do not put every paragraph inside cards.

Use editorial layouts, large imagery, whitespace, and structured metadata.

---

## 14. Project Data Model

```ts
{
  slug: string
  number: string
  title: string
  description: string
  year: string
  category: string[]
  technologies: string[]
  image: string
  featured: boolean
  client?: string
  role?: string
  problem?: string
  approach?: string
  features?: string[]
  result?: string
  metrics?: { label: string; value: string }[]
  liveUrl?: string
  githubUrl?: string
}
```

Never fabricate clients, metrics, testimonials, revenue, user numbers, or achievements.

---

## 15. Services

Title:

```text
WHAT I BUILD
```

Use numbered editorial rows rather than cards.

```text
01
WEB APPLICATIONS
Scalable web products from concept to production.

02
E-COMMERCE
Custom commerce experiences built around real business needs.

03
PRODUCT UI
Interfaces that are clear, useful, and distinctive.

04
AI INTEGRATION
Practical AI features inside real products.
```

Keep this section compact.

---

## 16. About

Short human copy:

```text
ABOUT

I'm a full-stack developer focused on building
useful digital products across web, product UI,
and AI.

I care about clean interfaces, scalable systems,
and shipping things that people actually use.
```

Information:

```text
ROLE        FULL-STACK DEVELOPER
FOCUS       WEB / PRODUCT / AI
LOCATION    INDIA / REMOTE
STATUS      AVAILABLE
```

Optional:

```text
[ VIEW RESUME ↗ ]
```

Do not write a long biography.

---

## 17. Technical Stack

Use a compact inventory, not fake proficiency bars.

```text
TECHNOLOGY

FRONTEND
React · Next.js · TypeScript

BACKEND
Python · Django · Node.js

DATABASE
PostgreSQL · MySQL · MongoDB

INFRA
Docker · Git · Vercel · AWS
```

Never use:

```text
React 95%
Python 87%
```

---

## 18. Contact CTA

Make contact a major visual moment:

```text
HAVE SOMETHING
WORTH BUILDING?

START A PROJECT ↗
```

Do not bury the CTA.

---

## 19. Contact Form

Fields:

```text
NAME
EMAIL
COMPANY / ORGANIZATION
PROJECT TYPE
BUDGET
TIMELINE
PROJECT DESCRIPTION
```

Project types:

```text
WEB APPLICATION
E-COMMERCE
PRODUCT UI
AI
OTHER
```

Requirements:
- client validation
- server validation
- spam protection
- accessible labels
- clear errors
- real success state

Success:

```text
MESSAGE RECEIVED.

THANK YOU.
I'LL GET BACK TO YOU SOON.
```

Failure:

```text
COULDN'T SEND THE MESSAGE.

Please try again or email directly.
```

---

## 20. Footer

Minimal:

```text
VECNA.DEV

WEB / PRODUCT / AI

EMAIL
[EMAIL]

GITHUB
LINKEDIN

© 2026 [NAME]

AVAILABLE FOR FREELANCE ●
```

No giant sitemap.

---

## 21. Optional Personality

Use only a few details:

```text
BUILT WITH
NEXT.JS / TYPESCRIPT / COFFEE
```

or:

```text
CURRENTLY BUILDING
[PROJECT]
```

or:

```text
OPEN TO
SELECTED FREELANCE PROJECTS
```

These should add personality without making the site feel like software.

---

## 22. Motion

Use:
- image reveal
- project hover
- button movement
- subtle section entrance
- menu transitions

Avoid:
- scroll-jacking
- constant floating
- bouncing
- animated backgrounds
- excessive parallax
- animation on every element

Timing:

```text
150–250ms default
300–450ms larger transitions
```

Respect `prefers-reduced-motion`.

---

## 23. Cursor

Optional desktop-only enhancement.

Project hover:

```text
VIEW ↗
```

External link:

```text
OPEN ↗
```

Do not replace the cursor globally.

Disable on touch devices.

---

## 24. Accessibility

Target WCAG 2.2 AA.

Required:
- semantic HTML
- keyboard navigation
- visible focus
- accessible form labels
- alt text
- sufficient contrast
- reduced-motion support
- correct heading hierarchy
- accessible mobile menu

Brutalism must never compromise usability.

---

## 25. Performance

Target:

```text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

Use:
- Next.js Image
- responsive images
- optimized fonts
- lazy loading
- server components where appropriate
- minimal client JavaScript

Avoid unnecessary dependencies.

---

## 26. SEO

Every route should include:
- unique title
- meta description
- canonical
- Open Graph
- sitemap
- robots.txt
- structured data where appropriate

Possible schema:
- Person
- ProfessionalService
- CreativeWork

---

## 27. Recommended Stack

```text
Next.js
TypeScript
Tailwind CSS
Motion / Framer Motion
Lucide React
```

Optional:
```text
Resend
Vercel Analytics
MDX
Zod
```

Do not add dependencies without a reason.

---

## 28. Code Architecture

```text
src/
├── app/
│   ├── page.tsx
│   ├── work/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── about/
│   ├── services/
│   └── contact/
│
├── components/
│   ├── layout/
│   ├── hero/
│   ├── work/
│   ├── services/
│   ├── about/
│   ├── contact/
│   └── ui/
│
├── content/
│   ├── site.ts
│   ├── projects.ts
│   ├── services.ts
│   └── testimonials.ts
│
├── lib/
├── types/
└── styles/
```

Keep content separate from presentation.

---

## 29. Site Configuration

```ts
export const siteConfig = {
  name: "[NAME]",
  title: "Full-Stack Developer",
  description: "I build digital products across web, product UI, and AI.",
  location: "India / Remote",
  availability: "available",
  email: "[EMAIL]",
  year: "2026",

  social: {
    github: "[URL]",
    linkedin: "[URL]",
    instagram: "[URL]"
  }
}
```

Do not hardcode personal data across components.

---

## 30. Design Tokens

```css
:root {
  --paper: #f4f0e7;
  --paper-muted: #dcd7cc;
  --ink: #111111;
  --accent: #dfff00;
  --orange: #ff5c35;

  --border: 2px;

  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2.5rem;
  --space-xl: 5rem;
  --space-2xl: 8rem;

  --container: 1440px;
}
```

Centralize visual tokens.

---

## 31. Image Direction

Prefer real work:
- actual website screenshots
- real product UI
- real project flows
- interface details

Avoid:
- generic stock photos
- generic laptop images
- fake startup imagery
- fake metrics
- decorative AI-generated imagery without purpose

If no image exists, use a typography-led placeholder.

---

## 32. Brutalist Rules

### Always
- strong typography
- hard borders
- warm paper surfaces
- direct copy
- clear hierarchy
- controlled asymmetry
- generous whitespace

### Sometimes
- hard offset shadows
- accent blocks
- oversized numbers
- rotated metadata
- overlaps

### Rarely
- rotation
- aggressive animation
- multiple accent colors
- chaotic composition

### Never
- unreadable text
- broken layouts
- excessive decoration
- fake controls
- confusing navigation
- dashboard/OS visual metaphor

---

## 33. Development Phases

### Phase 1 — Foundation
- inspect repository
- configure Next.js/TypeScript
- configure Tailwind
- add fonts
- create tokens
- create content architecture
- create global layout

### Phase 2 — Core UI
- header
- mobile navigation
- typography
- buttons
- section labels
- project rows
- image containers
- footer

### Phase 3 — Homepage
- hero
- selected work
- services
- about
- technology
- contact CTA

### Phase 4 — Work
- work index
- project detail pages
- case studies
- next-project navigation

### Phase 5 — Contact
- form
- validation
- submission
- success/error states
- spam protection

### Phase 6 — Interaction
- project hover
- subtle motion
- optional cursor
- menu transitions

### Phase 7 — Responsive QA
Test:
```text
320 / 375 / 390 / 640 / 768 / 1024 / 1280 / 1440 / 1920
```

### Phase 8 — Production
- accessibility audit
- performance audit
- SEO
- lint
- typecheck
- production build
- visual QA

---

## 34. QA Checklist

### Visual
- [ ] clean brutalist identity
- [ ] minimal, not empty
- [ ] bold, not chaotic
- [ ] no dashboard appearance
- [ ] no OS/interface metaphor
- [ ] no generic template appearance
- [ ] consistent borders
- [ ] restrained accent
- [ ] strong whitespace
- [ ] intentional asymmetry

### UX
- [ ] identity understood immediately
- [ ] work visible quickly
- [ ] services understandable
- [ ] availability visible
- [ ] contact easy to find
- [ ] navigation simple
- [ ] no confusing interactions

### Responsive
- [ ] 320px
- [ ] 375px
- [ ] 390px
- [ ] tablet
- [ ] desktop
- [ ] large desktop
- [ ] no horizontal overflow

### Accessibility
- [ ] keyboard navigation
- [ ] visible focus
- [ ] semantic HTML
- [ ] alt text
- [ ] form labels
- [ ] contrast
- [ ] reduced motion

### Performance
- [ ] optimized images
- [ ] optimized fonts
- [ ] minimal JS
- [ ] no unnecessary dependencies
- [ ] production build succeeds

### SEO
- [ ] metadata
- [ ] sitemap
- [ ] robots
- [ ] canonical
- [ ] OG image
- [ ] structured data

---

## 35. Agent Implementation Instructions

1. Inspect the existing repository first.
2. Preserve useful existing functionality.
3. Establish design tokens before individual sections.
4. Build mobile-first.
5. Build reusable components.
6. Keep content separate from presentation.
7. Use real supplied project information.
8. Never fabricate professional claims.
9. Never fabricate testimonials or metrics.
10. Do not copy the visual reference.
11. Do not create an OS, terminal, or dashboard metaphor.
12. Keep the design clean and minimal.
13. Use brutalist details selectively.
14. Do not over-animate.
15. Avoid unnecessary dependencies.
16. Test keyboard navigation.
17. Test reduced motion.
18. Test all responsive widths.
19. Run lint, typecheck, and production build.
20. Fix all errors before completion.

---

## 36. Acceptance Criteria

The final site must:
- feel distinctly brutalist
- remain clean and minimal
- look premium and professional
- not look like an operating system
- not look like a dashboard
- not resemble a generic portfolio template
- have a strong typography-led hero
- showcase real work prominently
- use editorial project layouts
- have dedicated project pages
- explain services clearly
- show technical credibility without fake ratings
- make availability obvious
- make contact easy
- work across mobile, tablet, and desktop
- have no horizontal overflow
- support keyboard navigation
- respect reduced motion
- load quickly
- have strong SEO fundamentals
- centralize content
- contain no fabricated professional information

---

## 37. Final Design North Star

The visitor should think:

> **“This is a developer/designer with strong taste.”**

Not:

> “This is an AI-generated portfolio.”

Not:

> “This is a SaaS dashboard.”

Not:

> “This brutalist site is trying too hard.”

The ideal formula:

```text
MINIMAL
+
BOLD TYPOGRAPHY
+
HARD EDGES
+
EDITORIAL COMPOSITION
+
REAL WORK
+
SUBTLE EXPERIMENTATION
```

---

## 38. Final One-Line Brief

> **Build a clean, minimal, premium freelancer portfolio with a controlled brutalist aesthetic — oversized editorial typography, hard borders, warm paper surfaces, restrained color, strong project presentation, subtle experimental details, and excellent responsive UX, without turning it into an operating system, dashboard, or chaotic anti-design website.**
