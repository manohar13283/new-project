# Canteen Worker App (React Native / Expo)

Implements the worker-facing screens from [`../docs/WIREFRAMES.md`](../docs/WIREFRAMES.md#mobile-app): login (password or OTP), home (today's coupons + monthly balance), QR scanner, coupon redemption confirm/success, post-redemption feedback, history, and settings (dark mode + Marathi/English).

## Setup

```bash
cp .env.example .env    # point EXPO_PUBLIC_API_BASE_URL at the backend
npm install
npm run start             # opens Expo Dev Tools; press "a" for Android
```

Requires the backend running locally (see `../backend/README.md`) and a physical device or emulator with camera access for QR scanning (`expo-camera`).

## Screen flow

`Login → Home → Scan (camera) → RedeemConfirm (select coupon type) → RedeemSuccess → Feedback (optional, skippable) → back to Home`

`History` and `Settings` are reachable from the bottom tab row on `Home`.

## Production build

Use Expo Application Services (EAS):
```bash
npx eas build --platform android --profile production
```
See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#hardening-checklist) for the pre-launch checklist (Play Store submission is out of scope for this scaffold).
