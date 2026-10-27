# Bellybloom

Bellybloom is a safety-first baby food planner and parent community built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, SQLite, NextAuth, Zod, React Hook Form, Recharts, and the OpenAI Responses API.

> **Important:** Bellybloom is a working MVP, not a production-ready medical or nutrition product. The feeding guidance, safety rules, privacy controls, and security design require review by qualified clinicians, privacy professionals, and security professionals before production use.

## Clean setup

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env`:

- Set `NEXTAUTH_SECRET` to a long random value. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` before seeding.
- Paid AI recipe generation is disabled by default. The app uses vetted local recipes while `AI_RECIPE_GENERATION_ENABLED="false"` or `OPENAI_API_KEY` is blank.
- `OPENAI_MODEL` is configurable and defaults to `gpt-4o-mini`.

Create and seed the local database:

```powershell
npx prisma migrate dev
npm run seed
npm run dev
```

Open `http://localhost:3000`. The seed creates the administrator from `.env`, five demo accounts (`demo1@bellybloom.local` through `demo5@bellybloom.local`, local-only password `Demo1234!`), six age stages, versioned guidance/rules, eight vetted recipes, and sample community posts.

Production build check:

```powershell
npm test
npm run typecheck
npm run build
npm start
```

## Implemented flows

### Phase 1 — core planner

- Server-validated registration, bcrypt password hashing, secure JWT cookies, login, logout, and protected layouts.
- Multi-step onboarding and owned baby profile create/read/update/delete flows.
- Shared completed-day/month age calculation with explicit `[minInclusive, maxExclusive)` stage boundaries.
- Public, versioned age guide with source, review date, and reviewer notes.
- Admin-reviewed recipe catalogue and recipe details.
- Daily plans cached per baby/date, limited regeneration, structured OpenAI output, deterministic post-validation, rejection records, and vetted fallback.
- Neutral under-six-month notice instead of solid-food plans.
- Account JSON export and password-confirmed cascade deletion.

### Phase 2 — personal library

- Owned food diary with observations, notes, timeline, deletion, and export.
- Favorites for vetted and private validated recipes.
- English and Bosnian/Croatian/Serbian-assisted local recipe search with stage, meal, allergen, and baby-profile filters.
- Optional generated search recipe with two attempts, deterministic validation, private visibility, rejection audit, and vetted alternatives.

### Phase 3 — community

- Paginated/searchable community posts, categories, age tags, comments, replies, edits, deletes, hugs, best answers, and reports.
- Server-side ownership checks, rate limits, basic profanity/spam checks, and escaped React rendering.
- Admin report queue, hide/restore/delete actions, user suspension, current-status authorization, and moderation audit records.

### Phase 4 — polish

- Admin analytics for registrations, active users, profiles, plans, and posts.
- Boundary-safe age-guide editing and deterministic safety checks for vetted recipe CRUD.
- Seven-day vetted planner, individual meal swaps, mark-as-served diary entries, and saving planned meals.
- Responsive light/dark UI, production-only service-worker registration, manifest, install prompt, maskable icon, and privacy-safe offline page.

## Feeding safety model

- `src/lib/age.ts` is the shared age and stage-boundary implementation.
- `SafetySource`, `SafetyRule`, and `AgeStage` store versioned source and review metadata.
- Seeded guidance references administrator-curated NHS first-food guidance and CDC choking-hazard guidance. Seed notes explicitly retain the requirement for local clinician review.
- `src/lib/safety.ts` is deterministic; the language model is never the safety validator.
- Known allergens are excluded, while `NOT_SURE` conservatively excludes all configured common allergens.
- Generated recipes are private and revalidated against the current baby profile and active rules before display or saving.
- Rejected candidates and reasons are stored in `RecipeRejection` for review.
- Recipes are general ideas, not medical advice. Allergy or feeding concerns should be discussed with a pediatrician.

## Privacy and authorization

- Passwords are never stored in plaintext; only bcrypt hashes are persisted.
- Every mutation route checks the authenticated account, current account status/role, same-origin requests, and resource ownership or admin authority.
- Baby profiles, allergy data, diary entries, plans, favorites, generated recipes, community data, reports, and rejection records are included in export or removed by account deletion/cascades.
- The service worker does not cache API responses or authenticated pages.
- Keep `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, and `OPENAI_API_KEY` server-only and out of version control.

## Tests

`npm test` covers:

- completed-day/month calculations and every age-stage boundary;
- contiguous, non-overlapping stage-sequence validation;
- ownership/role authorization helpers;
- known and uncertain allergen filtering;
- rejection of age-forbidden/choking-hazard recipes;
- bilingual recipe matching and community spam checks.

The API smoke flows used during development additionally verify cross-account denial for favorites/posts, under-age plan rejection, account export/deletion, report moderation, suspension enforcement, weekly plans, served meals, and admin-safe content editing.

## Known MVP limitations

- SQLite is configured for local development. The Prisma schema uses portable field types, but create a new provider-specific migration set before moving to PostgreSQL.
- Weekly plans intentionally use the vetted catalogue rather than making seven AI requests.
- Age-stage records can be edited but not created/deleted in the UI; this prevents accidental gaps and overlaps. Add a reviewed migration workflow before enabling structural stage changes.
- Search uses SQLite substring matching plus a small bilingual synonym map, not production full-text search.
- Rate limiting is database-backed and single-application; use a shared limiter such as Redis for multi-instance deployment.
- Email verification, password reset, MFA, image uploads, push notifications, and automated end-to-end browser tests are not included.
- PWA install prompts depend on browser criteria and HTTPS outside localhost. Offline mode is a public shell only; private data is deliberately unavailable offline.

## Roadmap

The next release should focus on review and production infrastructure rather than adding unreviewed feeding advice:

- Complete independent clinician review of every age stage, safety rule, recipe, source version, and administrator workflow.
- Complete privacy and security review, threat modeling, retention policy, incident response plan, and applicable legal disclosures.
- Move from local SQLite to a managed production database with provider-specific migrations, encrypted backups, restoration testing, and monitoring.
- Add verified email, password reset, optional MFA, session management, stronger distributed rate limiting, and administrator access controls.
- Add automated browser tests for registration, ownership boundaries, meal planning, moderation, account export/deletion, and accessibility.
- Add reviewed notification preferences, push notifications, richer moderation tools, and safer community onboarding.
- Improve search with production full-text indexing and expand translations after terminology review.
- Evaluate image uploads only after private storage, malware scanning, metadata removal, retention, and deletion are designed.
- Keep paid AI disabled by default. Any future model integration must remain optional, budget-limited, deterministic-rule validated, and unable to bypass the vetted safety system.
- Prepare production deployment, observability, uptime checks, support procedures, and staged PWA/mobile releases.

## Mobile path

The responsive PWA can be installed from supported browsers. A later native app can reuse the validated API/data contracts through React Native, or wrap the web build with Capacitor after adding a mobile threat model, secure token storage, native notifications, and app-store privacy disclosures.
