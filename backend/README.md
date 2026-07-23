# Canteen Backend (NestJS)

Implements the domain from [`../docs/SRS.md`](../docs/SRS.md): authentication, worker profile, shift & meal-window configuration, monthly coupon allocation, QR scan/redemption (with atomic double-spend protection), feedback, real-time dashboard (Socket.IO), and admin reporting/analytics.

## Setup

```bash
cp .env.example .env      # point DATABASE_URL/REDIS_URL at your local Postgres/Redis
npm install
npm run migration:run
npm run seed                # creates a demo factory, shifts, admin user, and one worker
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Dashboard WebSocket: `ws://localhost:3000/dashboard`

Seeded credentials (change immediately in any non-local environment):
- Admin: `admin@myunioncanteen.example.com` / `ChangeMe123!`
- Worker: clock number `W10001` / `Worker@123`
- Canteen QR value (for testing `/scan/redeem`): `CANTEEN-MAIN-001`

## Where the core business rules live

- `src/shifts/shift-window.util.ts` — shift/meal-window time matching + business-date resolution (handles the 3rd shift's post-midnight windows).
- `src/scan/scan.service.ts` — the redemption pipeline: QR validation → shift-window check → holiday check → atomic balance debit (row-locked) → duplicate-scan guard (DB partial unique index) → real-time dashboard broadcast.
- `src/coupons/coupons.service.ts` — idempotent monthly coupon allocation (26/26/26), scheduled via `@nestjs/schedule` cron and re-triggerable from the admin API.
- `src/migrations/1700000000000-InitSchema.ts` — full schema including the `uq_one_success_per_type_per_day` partial unique index that is the authoritative duplicate-scan guard.

## Testing

```bash
npm test
```

`src/shifts/shift-window.util.spec.ts` covers the shift-window matching and business-date rollover logic underlying the core coupon rules.
