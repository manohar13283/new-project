# API Reference

Base URL: `https://api.myunioncanteen.example.com/api/v1`
All requests/responses are JSON. All non-auth endpoints require `Authorization: Bearer <JWT>`.
Machine-readable spec: [`openapi.yaml`](./openapi.yaml).

## Auth

### `POST /auth/worker/login`
Login with clock number + password.
```json
// Request
{ "clockNumber": "W10234", "password": "••••••" }
// Response 200
{ "accessToken": "...", "refreshToken": "...", "worker": { "id": "...", "fullName": "Ramesh Kumar", "shift": "1ST" } }
```

### `POST /auth/worker/otp/request`
```json
{ "clockNumber": "W10234" }
```
### `POST /auth/worker/otp/verify`
```json
{ "clockNumber": "W10234", "otp": "482913" }
```

### `POST /auth/admin/login`
```json
{ "email": "admin@factory.com", "password": "••••••" }
```

### `POST /auth/refresh`
```json
{ "refreshToken": "..." }
```

### `POST /auth/logout`
Revokes the current device's refresh token.

---

## Worker App Endpoints

### `GET /me`
Returns worker profile, department, shift, language preference.

### `GET /me/coupons/today`
Returns which coupon types are currently redeemable right now, with window start/end and remaining monthly balance for each.
```json
{
  "businessDate": "2026-07-23",
  "shift": "1ST",
  "coupons": [
    { "type": "BREAKFAST_TEA", "window": "08:30-09:30", "isOpenNow": false, "remaining": 20, "usedToday": true },
    { "type": "MEAL", "window": "11:30-14:00", "isOpenNow": true, "remaining": 22, "usedToday": false },
    { "type": "TEA", "window": "14:30-15:30", "isOpenNow": false, "remaining": 25, "usedToday": false }
  ]
}
```

### `GET /me/coupons/balance?year=2026&month=7`
Monthly usage summary.

### `GET /me/transactions?from=&to=&type=`
Paginated coupon redemption history.

### `POST /scan/redeem`
Called after the worker scans the canteen QR and picks a coupon type.
```json
// Request
{ "qrCodeValue": "CANTEEN-MAIN-001", "couponType": "MEAL", "deviceId": "device-uuid" }
// Response 200
{
  "transactionId": "...",
  "status": "SUCCESS",
  "couponType": "MEAL",
  "scannedAt": "2026-07-23T11:47:02Z",
  "remainingAfter": 21
}
// Response 409 (already used)
{ "status": "REJECTED", "reason": "ALREADY_USED_TODAY", "existingTransaction": { "scannedAt": "...", "couponType": "MEAL" } }
// Response 422 (outside window)
{ "status": "REJECTED", "reason": "OUTSIDE_SHIFT_WINDOW", "message": "Meal is only available 11:30 AM – 02:00 PM" }
// Response 422 (balance exhausted)
{ "status": "REJECTED", "reason": "BALANCE_EXHAUSTED" }
```

### `POST /feedback`
```json
{
  "transactionId": "...",
  "rating": 4,
  "comment": "Tea was a bit cold today",
  "categories": ["TEA_QUALITY", "WAITING_TIME"],
  "photoUrl": null
}
```

### `GET /notifications`
### `PATCH /notifications/:id/read`

---

## Canteen / Admin Real-Time Dashboard

### `GET /dashboard/scans/today?shift=&department=&type=`
Snapshot list of today's scans (for initial page load; live updates arrive over WebSocket).

### WebSocket `wss://.../dashboard`
Namespace `/dashboard`, event `scan:new`, payload identical to a transaction row:
```json
{
  "workerName": "Ramesh Kumar",
  "clockNumber": "W10234",
  "department": "Assembly",
  "shift": "1ST",
  "couponType": "MEAL",
  "date": "2026-07-23",
  "time": "11:47:02",
  "status": "SUCCESS",
  "remaining": { "breakfastTea": 20, "meal": 21, "tea": 25 },
  "photoUrl": "https://.../w10234.jpg"
}
```

---

## Admin Management Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | `/admin/workers` | List / create workers |
| GET/PATCH/DELETE | `/admin/workers/:id` | Get / update / deactivate a worker |
| POST | `/admin/workers/import` | Bulk CSV import |
| POST | `/admin/workers/:id/reset-password` | Admin-triggered password reset |
| GET/POST | `/admin/shifts` | List / create shifts |
| GET/PATCH | `/admin/shifts/:id/meal-windows` | Configure meal windows |
| GET | `/admin/coupons/allocations?year=&month=` | View allocations |
| POST | `/admin/coupons/regenerate` | Manually (re-)run monthly allocation job (idempotent) |
| POST | `/admin/coupons/adjust` | Manual balance override (creates audit log entry) |
| GET/POST | `/admin/menu` | Menu management |
| GET/POST | `/admin/holidays` | Holiday management |
| POST | `/admin/notifications` | Broadcast a notification |
| GET | `/admin/reports/daily` \| `/monthly` \| `/department` \| `/shift` \| `/utilization` \| `/financial-savings` \| `/feedback` | Reports (`?format=json\|excel\|pdf`) |
| GET | `/admin/analytics/kpis?from=&to=` | Dashboard KPIs |
| GET | `/admin/audit-logs` | Audit trail |

All `/admin/*` routes require an `ADMIN`, `SUPER_ADMIN`, or (read-only subset) `CANTEEN_STAFF` role via RBAC guard.

## Error Format

```json
{ "statusCode": 422, "error": "OUTSIDE_SHIFT_WINDOW", "message": "Meal is only available 11:30 AM – 02:00 PM", "timestamp": "..." }
```

## Rate Limiting

- `/scan/redeem`: 10 req/min per worker (protects against replay/spam scanning).
- `/auth/*`: 5 req/min per IP.
