# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"My Union Canteen" — a QR-code-based digital canteen coupon system for factory workers. It exists to make a factory pay its canteen vendor for meals **actually consumed** (scanned) instead of blanket attendance-based billing. The full functional spec lives in `docs/SRS.md` — read it before changing coupon/shift business rules, since the code is a direct implementation of it.

This is a monorepo with four independently-versioned packages, each with its own `package.json`, `node_modules`, and lockfile — there is no root-level install or build:

```
backend/            NestJS API (source of truth for business rules)
admin-dashboard/     React + Vite admin/canteen dashboard
mobile-app/          React Native (Expo) worker app
infra/               docker-compose + Kubernetes manifests, no build step
docs/                SRS, DB schema (mermaid ER diagram), API.md, openapi.yaml, wireframes, deployment guide
```

Run all commands from inside the relevant package directory (`cd backend`, `cd admin-dashboard`, `cd mobile-app`), not from the repo root.

## Commands

### Backend (`backend/`)
```bash
npm install
cp .env.example .env          # requires local Postgres + Redis, or `docker compose -f ../infra/docker-compose.yml up -d postgres redis`
npm run migration:run          # applies backend/src/migrations/*.ts — schema is NOT auto-synced (synchronize: false)
npm run seed                   # demo factory/shifts/admin/worker; prints seeded login credentials
npm run start:dev              # http://localhost:3000/api/v1, Swagger at /api/docs, WS dashboard at /dashboard
npm run build                  # nest build — tsc compile, catches type errors across the whole module graph
npm test                       # jest, single run
npm run test:watch
npx jest src/shifts/shift-window.util.spec.ts   # run a single test file
npm run lint                   # eslint --fix (no .eslintrc is committed yet — see Known Gaps below)
npm run migration:generate -- src/migrations/SomeName   # generate a new migration from entity diffs
```

### Admin dashboard (`admin-dashboard/`)
```bash
npm install
cp .env.example .env          # VITE_API_BASE_URL / VITE_WS_BASE_URL, defaults point at localhost:3000
npm run dev                    # http://localhost:5173
npm run build                  # tsc -b && vite build — run this to type-check, there is no separate `tsc --noEmit` script
```
No test runner is configured for this package.

### Mobile app (`mobile-app/`)
```bash
npm install
cp .env.example .env          # EXPO_PUBLIC_API_BASE_URL
npm run start                  # Expo dev server; press "a" for Android
```
No test runner or standalone type-check script is configured; `npx tsc --noEmit` works ad hoc. Requires a device/emulator with camera access for the QR scanner (`expo-camera`).

### Infra (`infra/`)
```bash
docker compose -f infra/docker-compose.yml up -d          # postgres, redis, backend, admin-dashboard
```
Kubernetes manifests in `infra/k8s/` are applied individually (see `docs/DEPLOYMENT.md`); there's no single `kubectl apply -k` kustomization.

## Architecture

### Backend is the source of truth
All coupon/shift business rules are enforced server-side and re-validated on every request — the mobile app's "is this coupon open right now" display is a convenience, not an authority. Never trust client-supplied state (window openness, remaining balance) when changing backend logic.

### Where the core rules live (read these before touching coupon/shift logic)
- `backend/src/shifts/shift-window.util.ts` — pure functions for shift/meal-window time matching (`isWithinWindow`, `findOpenWindow`) and business-date resolution (`resolveBusinessDate`). Wrap-around windows (e.g. spanning midnight) are detected by comparing `start > end` lexicographically, **not** by the entity's `crossesMidnight` flag — that flag only controls which calendar day a post-midnight redemption (e.g. 3rd shift's 01:30-02:30 window) gets attributed to. Covered by `shift-window.util.spec.ts`; this is the one file in the repo with real unit tests, and any change to window/business-date semantics should extend it.
- `backend/src/scan/scan.service.ts` — the redemption pipeline: QR code lookup → shift-window check → holiday check → **atomic** balance debit inside a `DataSource.createQueryRunner()` transaction with `pessimistic_write` row lock on the worker's `MonthlyCouponAllocation` row (prevents two concurrent scans from double-spending the same balance) → insert `CouponTransaction` → broadcast to `DashboardGateway`. A Postgres `23505` unique-violation on insert is caught and converted into an "already used today" `ConflictException` — the DB constraint is the real duplicate-scan guard, the application-level checks are a fast-path/UX layer on top of it.
- `backend/src/migrations/1700000000000-InitSchema.ts` — hand-written raw-SQL migration (not `synchronize: true`, not auto-generated) containing the schema including the partial unique index that makes duplicate-scan prevention airtight even under concurrent requests across replicas:
  ```sql
  CREATE UNIQUE INDEX "uq_one_success_per_type_per_day"
  ON "coupon_transaction" ("worker_id", "coupon_type", "business_date")
  WHERE "status" = 'SUCCESS'
  ```
  Any schema change must be a new migration file (`npm run migration:generate`), never an edit to this one.
- `backend/src/coupons/coupons.service.ts` — monthly coupon allocation (26 Breakfast+Tea / 26 Meal / 26 Tea per worker) is **idempotent**: `generateMonthlyAllocations(year, month)` skips workers who already have a row for that period. It's wired to both a cron (`@Cron('0 5 0 1 * *')`, 00:05 on the 1st) and an admin-triggered `POST /admin/coupons/regenerate`, and `infra/k8s/cronjob-monthly-coupons.yaml` hits the same admin endpoint as a redundant external trigger. When changing allocation logic, preserve idempotency — it's relied on by all three trigger paths.

### Backend module layout
Each business area (`auth`, `workers`, `shifts`, `coupons`, `scan`, `feedback`, `dashboard`, `admin`, `analytics`) is a self-contained Nest module under `backend/src/<area>/` with its own `*.module.ts`, `*.service.ts`, `*.controller.ts`. `admin/` bundles several small controllers (menu, holidays, notifications, reports, audit) that don't warrant their own top-level module. `workers/` splits worker-facing `/me/*` endpoints (`workers.controller.ts`) from admin-facing `/admin/workers/*` CRUD (`admin-workers.controller.ts`) in the same module. Entities live centrally in `backend/src/entities/`, not per-module.

**Two different exports of the entity list exist on purpose:**
- `entities/index.ts` — a barrel (`export *`) used for convenient named imports elsewhere in the app (e.g. `import { Worker } from '../entities'`).
- `entities/all-entities.ts` — an explicit `ALL_ENTITIES` array of entity *classes only*, consumed by `app.module.ts` (TypeORM's `entities:` option) and `config/typeorm.config.ts` (the CLI DataSource for migrations). This exists because `entities/index.ts` also re-exports non-entity items (e.g. `FeedbackCategory`, an enum from `feedback.entity.ts`), which breaks TypeORM if passed as an "entity." When adding a new entity, register it in **both** files.

Auth: JWT access/refresh tokens (`@nestjs/jwt`, `passport-jwt`), workers log in via clock number + password or clock number + OTP (`auth/otp.service.ts`, OTP codes cached in Redis — the SMS send is currently a `Logger.log` stub, see Known Gaps). Admins log in via email + password with roles (`SUPER_ADMIN` / `ADMIN` / `CANTEEN_STAFF`) enforced by `common/guards/roles.guard.ts` + `@Roles()` decorator. Global `ThrottlerGuard` is registered via `APP_GUARD` in `app.module.ts`; individual endpoints add tighter `@Throttle()` limits (e.g. `/scan/redeem`, `/auth/*`).

Real-time: `dashboard/dashboard.gateway.ts` is a Socket.IO gateway on the `/dashboard` namespace. `scan.service.ts` calls `dashboardGateway.broadcastScan()` after a successful redemption; both the canteen-facing display and the admin dashboard's Live Dashboard page subscribe to the same `scan:new` event. In a multi-replica deployment this needs the Redis Socket.IO adapter wired in (noted as a TODO in `docs/DEPLOYMENT.md`, not yet implemented in `main.ts`).

### Frontend apps talk to the same backend contract
`admin-dashboard/src/lib/api.ts` and `mobile-app/src/lib/api.ts` are separate axios instances (different token storage: `localStorage` vs `AsyncStorage`), both pointed at `backend`'s `/api/v1` prefix via env vars. `docs/API.md` and `docs/openapi.yaml` are the canonical request/response contract — when changing a backend DTO or response shape, update both docs files and the corresponding frontend call site(s) together, since there's no shared generated client.

`admin-dashboard/src/hooks/useScanFeed.ts` and the mobile app's redeem flow (`RedeemConfirmScreen` → `RedeemSuccessScreen` → `FeedbackScreen`) are the two places that most directly encode the `/scan/redeem` and `/feedback` API contracts — check both when changing those endpoints.

### i18n and theming (mobile app)
`mobile-app/src/i18n/translations.ts` holds English/Marathi strings as a flat key-value object per language (no external i18n library, despite `i18n-js` being a listed dependency — it isn't currently used); `I18nProvider` exposes `t(key)`. Add new user-facing strings to both `en` and `mr` objects. Theme (light/dark) is a simple React Context in `mobile-app/src/theme/ThemeProvider.tsx`, not a system-wide design token pipeline.

## Known Gaps (don't assume these are done)

- No `.eslintrc`/`eslint.config.*` is committed in any package despite each having a `lint` script — running `npm run lint` will fail without adding a config first.
- No test runner is configured for `admin-dashboard` or `mobile-app`; `backend` has Jest but only one spec file (`shift-window.util.spec.ts`) — most services/controllers are untested.
- `auth/otp.service.ts` logs OTPs instead of sending real SMS (`// TODO: integrate real SMS provider`).
- Socket.IO has no Redis adapter wired up yet, so `dashboard.gateway.ts` broadcasts only reach clients connected to the same backend pod — fine for one replica, broken for the multi-replica deployment `infra/k8s/hpa.yaml` scales to.
- Full pre-production checklist is in `docs/DEPLOYMENT.md#hardening-checklist` (secrets management, load testing, pen-testing, Socket.IO Redis adapter, Play Store release).
