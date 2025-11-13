## Project File Structure Plan (Next.js App Router)

This structure is tailored for a full-stack Next.js (App Router) application with REST APIs, Prisma ORM, and a background scheduler for social publishing.

Goals:
- Clear separation of concerns (UI, API, domain services, data access)
- Scales from MVP to production (workers, feature folders, tests)
- Aligns with the Prisma schema and the API spec in `docs/api.md`

### Top-level layout

```
.
├─ prisma/                         # Prisma schema, migrations, seeds
│  ├─ schema.prisma
│  ├─ dev.db                       # SQLite dev database (checked in for local + tests)
│  ├─ migrations/
│  └─ seed.ts                      # optional seeding (plans, demo data)
├─ public/                         # Static assets served at /
│  ├─ images/                      # Static images/icons
│  └─ uploads/                     # Dev-only media (small) when using local storage
├─ src/
│  ├─ app/                         # Next.js App Router
│  │  ├─ (marketing)/              # Route group for marketing pages (optional)
│  │  │  └─ page.tsx
│  │  ├─ (app)/                    # Route group for the authenticated app shell
│  │  │  ├─ layout.tsx             # App shell (nav/sidebar)
│  │  │  ├─ dashboard/
│  │  │  │  └─ page.tsx
│  │  │  ├─ releases/
│  │  │  │  ├─ page.tsx            # Releases list
│  │  │  │  └─ [id]/
│  │  │  │     └─ page.tsx         # Release detail (tasks, progress)
│  │  │  ├─ posts/
│  │  │  │  ├─ page.tsx            # Social posts list/composer
│  │  │  │  └─ [id]/
│  │  │  │     └─ page.tsx         # Post detail/edit
│  │  │  ├─ settings/
│  │  │  │  ├─ profile/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ preferences/
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ billing/
│  │  │  │  │  └─ page.tsx
│  │  │  │  └─ connections/
│  │  │  │     └─ page.tsx         # Social account connections
│  │  ├─ (auth)/                   # Auth pages route group
│  │  │  ├─ signin/ page.tsx
│  │  │  ├─ signup/ page.tsx
│  │  │  ├─ reset-password/ page.tsx
│  │  │  └─ verify-email/ page.tsx
│  │  ├─ api/                      # REST API route handlers (Edge or Node runtimes)
│  │  │  ├─ health/route.ts
│  │  │  ├─ auth/
│  │  │  │  ├─ signup/route.ts
│  │  │  │  ├─ login/route.ts
│  │  │  │  ├─ refresh/route.ts
│  │  │  │  ├─ logout/route.ts
│  │  │  │  ├─ password/
│  │  │  │  │  ├─ request-reset/route.ts
│  │  │  │  │  └─ reset/route.ts
│  │  │  │  └─ verify-email/
│  │  │  │     ├─ request/route.ts
│  │  │  │     └─ confirm/route.ts
│  │  │  ├─ me/route.ts            # GET current user
│  │  │  ├─ me/patch/route.ts      # PATCH profile (alternative: combine into one route)
│  │  │  ├─ me/preferences/route.ts
│  │  │  ├─ notifications/route.ts
│  │  │  ├─ notifications/[id]/read/route.ts
│  │  │  ├─ releases/route.ts      # GET, POST
│  │  │  ├─ releases/[id]/route.ts # GET, PATCH, DELETE
│  │  │  ├─ releases/[id]/progress/route.ts
│  │  │  ├─ releases/[id]/tasks/route.ts                # GET, POST
│  │  │  ├─ tasks/[taskId]/route.ts                     # PATCH, DELETE
│  │  │  ├─ tasks/[taskId]/complete/route.ts
│  │  │  ├─ tasks/[taskId]/uncomplete/route.ts
│  │  │  ├─ tasks/reorder/route.ts
│  │  │  ├─ media/upload/route.ts
│  │  │  ├─ media/route.ts         # GET list
│  │  │  ├─ media/[id]/route.ts    # DELETE
│  │  │  ├─ social/accounts/route.ts
│  │  │  ├─ social/accounts/[platform]/connect/route.ts
│  │  │  ├─ social/accounts/[platform]/callback/route.ts
│  │  │  ├─ social/accounts/[id]/route.ts               # DELETE
│  │  │  ├─ social/accounts/[id]/refresh/route.ts
│  │  │  ├─ posts/route.ts                               # GET, POST
│  │  │  ├─ posts/[id]/route.ts                          # GET, PATCH, DELETE
│  │  │  ├─ posts/[id]/schedule/route.ts
│  │  │  ├─ posts/[id]/cancel/route.ts
│  │  │  ├─ posts/[id]/publish-now/route.ts
│  │  │  ├─ posts/[id]/media/route.ts                    # POST attach
│  │  │  ├─ posts/[id]/media/[postMediaId]/route.ts      # DELETE detach
│  │  │  ├─ billing/plans/route.ts
│  │  │  ├─ billing/subscription/route.ts
│  │  │  ├─ billing/subscribe/route.ts
│  │  │  ├─ billing/change-plan/route.ts
│  │  │  ├─ billing/cancel/route.ts
│  │  │  └─ webhooks/stripe/route.ts
│  │  ├─ favicon.ico
│  │  ├─ globals.css
│  │  ├─ layout.tsx                  # Root layout (theme provider)
│  │  └─ page.tsx                    # Landing page or redirect
│  ├─ components/                    # Reusable UI components
│  │  ├─ Dashboard.tsx               # Current dashboard prototype (renders in app/page.tsx)
│  │  ├─ ui/                         # Design system primitives (buttons, inputs) (planned)
│  │  ├─ forms/                      # Form controls, schema-bound fields (planned)
│  │  ├─ layout/                     # App layout pieces (sidebar, header) (planned)
│  │  └─ charts/                     # Progress bars, charts (planned)
│  ├─ hooks/                         # Client hooks (theme, keyboard shortcuts, data fetching) (planned)
│  ├─ lib/                           # Shared libraries (server/client)
│  │  ├─ prisma.ts                   # Prisma client singleton (import from src/generated/prisma)
│  │  ├─ config.ts                   # app config (env, constants)
│  │  ├─ api/
│  │  │  ├─ authCookies.ts           # refresh cookie helpers
│  │  │  ├─ context.ts               # request metadata extraction
│  │  │  └─ errorResponse.ts         # unified error formatter
│  │  ├─ auth/
│  │  │  ├─ jwt.ts                   # sign/verify access tokens
│  │  │  ├─ password.ts              # hashing, password policy
│  │  │  └─ refreshToken.ts          # refresh token helpers
│  │  ├─ crypto.ts                   # encryption helpers for OAuth tokens (planned)
│  │  ├─ email.ts                    # email sending (reset/verify) (planned)
│  │  ├─ rateLimit.ts                # reusable rate limiter util (planned)
│  │  ├─ pagination.ts               # cursor helpers (opaque base64)
│  │  ├─ validation/                 # zod schemas for REST payloads (auth, release, task)
│  │  ├─ error.ts                    # error classes/formatting (planned)
│  │  ├─ logger.ts                   # pino/console wrapper (planned)
│  ├─ server/                        # Server-only domain logic
│  │  ├─ repositories/               # DB access (thin wrappers around Prisma)
│  │  │  ├─ userRepository.ts
│  │  │  ├─ refreshTokenRepository.ts
│  │  │  ├─ passwordResetTokenRepository.ts
│  │  │  ├─ emailVerificationTokenRepository.ts
│  │  │  ├─ loginAttemptRepository.ts
│  │  │  ├─ releaseRepository.ts     # ReleaseStrategy DB access
│  │  │  ├─ taskRepository.ts        # Task DB access
│  │  │  ├─ socialRepo.ts            # planned
│  │  │  ├─ mediaRepo.ts             # planned
│  │  │  └─ billingRepo.ts           # planned
│  │  ├─ services/                   # Business logic/use-cases
│  │  │  ├─ authService.ts
│  │  │  ├─ releaseService.ts        # business logic for releases
│  │  │  ├─ taskService.ts           # business logic for tasks
│  │  │  ├─ postService.ts           # Compose platform posting, validations (planned)
│  │  │  ├─ socialAccountService.ts  # planned
│  │  │  ├─ mediaService.ts          # planned
│  │  │  └─ billingService.ts        # planned
│  │  ├─ workflows/                  # Multi-step flows, schedulers
│  │  │  └─ publishWorkflow.ts       # planned
│  │  └─ platform/                   # Platform clients (X, Instagram, etc.)
│  │     ├─ xClient.ts               # planned
│  │     ├─ instagramClient.ts       # planned
│  │     └─ facebookClient.ts        # planned
│  ├─ styles/                        # Global styles (if split) (planned)
│  ├─ types/                         # Shared TypeScript types/DTOs (planned)
│  └─ generated/
│     └─ prisma/                     # Prisma Client output (auto-generated)
├─ scripts/                          # Node scripts (CLI, jobs, dev tooling)
│  ├─ seed.ts                        # Seeds plans and optional sample data
│  ├─ cron.ts                        # Scheduler entry (every minute for posts)
│  └─ worker.ts                      # Background worker (queue-based optional)
├─ storage/                          # Dev-only local storage for larger media (excluded from git)
│  └─ media/
├─ tests/
│  ├─ unit/
│  │  ├─ lib/
│  │  │  └─ auth/                    # Auth helper unit tests
│  │  └─ api/
│  │     └─ auth/                    # Auth route unit tests
│  ├─ integration/
│  │  └─ api/                        # Auth flow integration tests
│  ├─ utils/                         # Shared helpers (e.g., SQLite clone for tests)
│  ├─ api/                           # API contract tests (planned)
│  └─ e2e/                           # E2E tests (Playwright) (planned)
├─ middleware.ts                     # Next.js edge middleware (auth, rate-limit)
├─ next.config.ts
├─ tsconfig.json
├─ .env                               # environment variables
└─ docs/
   ├─ api.md
   └─ structure.md
```

Notes:
- Use route groups `(marketing)` and `(app)` to control layouts and auth boundaries without affecting URL paths.
- `middleware.ts` handles auth cookie parsing for protected routes, rate-limiting of sensitive endpoints, and theme cookie passthrough.
- For large media in dev, prefer `storage/media` (served by an API route or static handler) rather than `public/uploads`.

### API route handler conventions

- Each REST endpoint in `docs/api.md` maps to a directory with a `route.ts`. For dynamic params, use `[param]` folder names.
- Prefer a thin route handler → service call pattern, with validation via Zod and consistent error formatting.
- Pagination parameters: `limit`, `cursor`. Sorting: `sort`, `order`. Validate and default.
- Return 404 for missing or unauthorized resources to avoid information leaks.

Example route skeleton:
```ts
// src/app/api/releases/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getReleaseById, updateRelease, deleteRelease } from '@/src/server/services/releaseService'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const release = await getReleaseById(params.id)
  return NextResponse.json(release)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const updated = await updateRelease(params.id, body)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteRelease(params.id)
  return new NextResponse(null, { status: 204 })
}
```

### Frontend organization

- Keep domain pages under `(app)` route group with colocation of UI components (small, page-specific components) next to pages when helpful.
- Put reusable UI primitives in `src/components/ui` and complex, cross-page components in feature subfolders.
- Use `src/hooks` for client-side hooks (theme, keyboard shortcuts, optimistic updates); prefer React Server Components for data fetching when feasible; use REST for mutation heavy interactions.

### Server organization

- `server/repositories`: Wrap Prisma for narrow, testable DB access; keep queries centralized and indexed as per schema.
- `server/services`: Implement business logic and limits (task cap 500, plan quotas, scheduling state transitions). Services should be side-effect aware (notifications, retries) and idempotent where needed.
- `server/workflows`: Longer-running flows like post publishing that may orchestrate retries and per-target status updates.
- `server/platform`: Platform-specific clients (token handling, API calls, rate limit policies). Keep secrets out of repos; read from `process.env`.

### Libraries and utilities

- `lib/prisma.ts`: Singleton Prisma client. Import type-safe client from `src/generated/prisma`.
- `lib/auth/*`: JWT signing/verification, refresh token rotation and revocation, password hashing/policies.
- `lib/crypto.ts`: Symmetric encryption utilities to store OAuth tokens securely.
- `lib/validation`: Zod schemas mirroring `docs/api.md` request bodies; reuse between client and server where possible.
- `lib/pagination.ts`: Cursor helpers; serialize/deserialize opaque cursors.
- `lib/email.ts`: Mailer abstraction (e.g., Resend/SMTP); templates stored as inline or in `src/server/emails/`.
- `lib/rateLimit.ts`: Reusable rate limiter (e.g., memory + token-bucket for dev; Redis in prod).

### Background processing

- `scripts/cron.ts`: Polls scheduled posts each minute, enqueues publish jobs or runs inline in MVP.
- `scripts/worker.ts`: Optional worker process for queues (e.g., BullMQ). Reads jobs, posts to platforms, updates `SocialPostTarget` status, and logs Notifications.
- Use environment variable toggles to run cron/worker in dev; in production, use platform-specific schedulers.

### Config and environment

- `lib/config.ts`: Centralize configuration (JWT lifetimes, password policy, media size limits, plan limits defaults). Read from `.env` and provide safe defaults for dev.
- Sensitive keys (encryption key for OAuth tokens, JWT secrets) are read from environment; do not commit.

### Testing

- `tests/unit`: Focus on services and repositories (mock platform clients and email).
- `tests/api`: Contract tests hitting route handlers with fetch/supertest against Next server.
- `tests/e2e`: Playwright flows (login, create release, add tasks, schedule a post).

### Linting, types, and DX

- Enforce strict TypeScript, ESLint rules, and Prettier (optional). Keep DTOs in `src/types` and Zod schemas colocated under `lib/validation`.
- Consider path aliases in `tsconfig.json` (e.g., `@/` to `./src`).

### Data & seeds

- `prisma/seed.ts`: Seed the `Plan` table (Free tier with limits) and optionally a demo user with a release and tasks for quick UI bootstrapping.

### Migrations & generated code

- Avoid editing `src/generated/prisma` manually; it is produced by Prisma Client generation.
