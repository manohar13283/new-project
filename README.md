# My Union Canteen — Smart QR-Based Digital Canteen Coupon Management System

A production-grade platform that ensures the company pays the canteen only for meals **actually consumed** by factory workers, tracked via QR-code scanning instead of blanket attendance-based billing.

## Repository Layout

```
new-project/
├── docs/                   Full project documentation
│   ├── SRS.md               Software Requirement Specification
│   ├── DATABASE.md          ER diagram + schema reference
│   ├── API.md                REST API reference
│   ├── openapi.yaml          Machine-readable OpenAPI 3.0 spec
│   ├── WIREFRAMES.md         UI/UX wireframes (mobile + admin)
│   └── DEPLOYMENT.md         Docker + Kubernetes deployment guide
├── backend/                 NestJS API (auth, coupons, shifts, scans, feedback, analytics)
├── admin-dashboard/         React + TypeScript admin/canteen dashboard
├── mobile-app/              React Native (Expo) worker app
├── infra/                   Dockerfiles, docker-compose, Kubernetes manifests
└── README.md
```

## Quick Start (Local Development)

```bash
# 1. Start Postgres + Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev        # http://localhost:3000/api

# 3. Admin dashboard
cd ../admin-dashboard
npm install
npm run dev               # http://localhost:5173

# 4. Mobile app
cd ../mobile-app
npm install
npm run start              # Expo dev server
```

## Core Business Rule

Each worker receives **26 Breakfast+Tea, 26 Meal, and 26 Tea coupons every month** (78 total), reset automatically on the 1st of the month. A coupon can only be redeemed once per day, and only inside its shift's valid meal window, by scanning the canteen's single permanent QR code. See [`docs/SRS.md`](docs/SRS.md) for the full specification.

## Documentation

| Document | Description |
|---|---|
| [SRS](docs/SRS.md) | Full functional & non-functional requirements |
| [Database Schema](docs/DATABASE.md) | ER diagram, tables, constraints |
| [API Reference](docs/API.md) | REST endpoints, auth, request/response examples |
| [OpenAPI Spec](docs/openapi.yaml) | Importable into Swagger/Postman |
| [Wireframes](docs/WIREFRAMES.md) | Mobile app + admin dashboard screens |
| [Deployment Guide](docs/DEPLOYMENT.md) | Docker Compose + Kubernetes |

## Tech Stack

- **Mobile**: React Native (Expo), Android-first
- **Admin Dashboard**: React + TypeScript + Vite
- **Backend**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Realtime**: Socket.IO
- **Auth**: JWT + OTP
- **Deployment**: Docker + Kubernetes

## Implementation Status

This repository ships a fully documented specification plus a working reference implementation of the core domain (auth, workers, shifts, monthly coupon allocation, QR scan validation & redemption, feedback, real-time dashboard, analytics). It is a strong foundation for a production rollout — see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#hardening-checklist) for what to review before going live with real payroll/financial data (secrets management, load testing, pen-testing, SMS/OTP provider integration, App Store release process).
