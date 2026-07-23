# Canteen Admin Dashboard

React + TypeScript + Material UI admin/canteen dashboard implementing the screens in [`../docs/WIREFRAMES.md`](../docs/WIREFRAMES.md#admin-web-dashboard).

## Pages

- **Live Dashboard** (`/`) — real-time scan feed over Socket.IO, matches the canteen-facing display.
- **Workers** (`/workers`) — search/browse worker roster.
- **Analytics** (`/analytics`) — KPI cards + charts (consumption by type/department/shift).
- **Reports** (`/reports`) — Excel/PDF export for daily, monthly, and coupon-utilization reports.
- **Feedback** (`/feedback`) — average rating + most common complaint categories.

## Setup

```bash
cp .env.example .env   # point VITE_API_BASE_URL / VITE_WS_BASE_URL at the backend
npm install
npm run dev
```

Login with the seeded admin from the backend: `admin@myunioncanteen.example.com` / `ChangeMe123!`.
