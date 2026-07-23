# Deployment Guide — Docker + Kubernetes

## 1. Local Development (Docker Compose)

```bash
cd infra
docker compose up -d
```

This starts:
- `postgres` (5432) — persists to a named volume
- `redis` (6379)
- `backend` (3000) — NestJS API + Socket.IO, hot-reload via bind mount in dev mode
- `admin-dashboard` (5173) — Vite dev server

`infra/docker-compose.yml` uses environment variables from `infra/.env` (copy from `infra/.env.example`).

## 2. Building Production Images

```bash
docker build -t myunioncanteen/backend:1.0.0        -f infra/docker/backend.Dockerfile        .
docker build -t myunioncanteen/admin-dashboard:1.0.0 -f infra/docker/admin-dashboard.Dockerfile .
```

Mobile app is distributed via Expo EAS Build (Android `.aab`/`.apk`, iOS `.ipa`), not containerized — see `mobile-app/README.md`.

## 3. Kubernetes

Manifests live in `infra/k8s/`:

| File | Purpose |
|---|---|
| `namespace.yaml` | `canteen` namespace |
| `secrets.example.yaml` | Template for DB/JWT/Redis/S3 secrets — copy to `secrets.yaml`, fill in, **never commit real secrets** |
| `postgres-statefulset.yaml` | PostgreSQL with PVC |
| `redis-deployment.yaml` | Redis cache |
| `backend-deployment.yaml` | NestJS API, 3 replicas, readiness/liveness probes, HPA |
| `admin-dashboard-deployment.yaml` | Static admin SPA served via nginx |
| `ingress.yaml` | TLS-terminated ingress (cert-manager annotations), routes `/api` → backend, `/` → admin dashboard |
| `hpa.yaml` | Horizontal Pod Autoscaler for backend (CPU + custom scan-rate metric) |
| `cronjob-monthly-coupons.yaml` | Backup safety-net CronJob calling `/admin/coupons/regenerate` on the 1st (the backend also self-schedules this via `@nestjs/schedule`; the CronJob is a redundant external trigger for resilience) |

Apply:
```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/postgres-statefulset.yaml
kubectl apply -f infra/k8s/redis-deployment.yaml
kubectl apply -f infra/k8s/backend-deployment.yaml
kubectl apply -f infra/k8s/admin-dashboard-deployment.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/hpa.yaml
kubectl apply -f infra/k8s/cronjob-monthly-coupons.yaml
```

Run migrations as a one-off Job (or `kubectl exec` into a backend pod):
```bash
kubectl exec -it deploy/backend -n canteen -- npm run migration:run
```

## 4. Environment Variables (Backend)

| Var | Description |
|---|---|
| `DATABASE_URL` | `postgres://user:pass@host:5432/canteen` |
| `REDIS_URL` | `redis://host:6379` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Signing secrets (rotate via k8s Secret) |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | e.g. `15m` / `30d` |
| `OTP_PROVIDER_API_KEY` | SMS gateway key (worker OTP login) |
| `AWS_S3_BUCKET` / `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Photo/feedback-image storage |
| `CORS_ORIGIN` | Admin dashboard origin |
| `NODE_ENV` | `production` |

## 5. Scaling Guidance

- **Backend**: stateless, scales horizontally. The row-level `SELECT ... FOR UPDATE` lock on `monthly_coupon_allocation` keeps coupon-debit correctness under multiple replicas — no in-memory state to worry about.
- **Socket.IO**: wire up the Redis adapter (`@socket.io/redis-adapter`, already a backend dependency but not yet attached to the gateway's server in `backend/src/dashboard/dashboard.gateway.ts`/`main.ts`) before running multiple backend replicas, so scan events fan out to dashboard clients connected to a different pod.
- **Database**: PgBouncer in front of PostgreSQL recommended above ~500 backend connections; add read replicas for reporting queries if the analytics load grows.
- **Peak load**: shift-change windows (e.g., 08:30–09:30) are the traffic spikes — HPA is tuned to scale backend pods on CPU and on a custom `scan_requests_per_second` metric.

## 6. Hardening Checklist (Before Production Go-Live)

- [ ] Replace all placeholder secrets in `infra/k8s/secrets.example.yaml` with real, vaulted secrets (e.g., via Sealed Secrets or an external secrets operator).
- [ ] Integrate a real SMS/OTP provider (e.g., MSG91, Twilio) — current `OtpService` is provider-agnostic behind an interface.
- [ ] Load-test `/scan/redeem` for the shift-change burst (thousands of scans in a 5-10 min window).
- [ ] Run a security review / penetration test (see repo's `security-review` process) before handling real payroll-linked billing data.
- [ ] Configure log aggregation (e.g., ELK/CloudWatch) and alerting on rejected-scan spikes (could indicate QR misconfiguration or fraud attempts).
- [ ] Set up automated PostgreSQL backups + point-in-time recovery.
- [ ] Finalize data retention/PII policy (photos, feedback) with legal/HR.
- [ ] Complete Expo EAS production build + Play Store / App Store submission process.
