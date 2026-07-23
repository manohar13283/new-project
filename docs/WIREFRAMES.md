# UI/UX Wireframes

Low-fidelity ASCII wireframes describing layout and flow. Visual design follows Material Design 3, large tap targets, and full Marathi/English localization (all copy externalized to `i18n` resource files).

## Mobile App

### 1. Login
```
┌───────────────────────────┐
│      🍽  My Union Canteen  │
│                            │
│  Clock Number              │
│  ┌───────────────────────┐ │
│  │ W10234                │ │
│  └───────────────────────┘ │
│  Password        [Use OTP]│
│  ┌───────────────────────┐ │
│  │ ••••••••              │ │
│  └───────────────────────┘ │
│                            │
│  [        LOGIN        ]  │
│                            │
│      English | मराठी       │
└───────────────────────────┘
```

### 2. Home
```
┌───────────────────────────┐
│ ☰  Hi, Ramesh (W10234) 🌙 │
│    Dept: Assembly · 1st Sh│
├───────────────────────────┤
│  TODAY'S COUPONS           │
│  ┌─────────┐┌─────────┐   │
│  │🍳 B+Tea ││🍛 Meal  │   │
│  │ USED ✓  ││ 11:30-  │   │
│  │ 08:30-  ││ 14:00   │   │
│  │ 09:30   ││ OPEN NOW│   │
│  └─────────┘└─────────┘   │
│  ┌─────────┐               │
│  │☕ Tea    │               │
│  │14:30-   │               │
│  │15:30    │               │
│  └─────────┘               │
├───────────────────────────┤
│  Monthly Balance            │
│  B+Tea 20/26  Meal 22/26   │
│  Tea 25/26                  │
├───────────────────────────┤
│  [ 📷  SCAN CANTEEN QR  ]  │
└───────────────────────────┘
│ Home  History  Feedback  ⚙ │
└───────────────────────────┘
```

### 3. QR Scanner → Coupon Confirm
```
┌───────────────────────────┐
│  ← Scan Canteen QR         │
│  ┌───────────────────────┐ │
│  │                       │ │
│  │      [camera view]    │ │
│  │      ▢▢▢▢▢▢▢▢▢▢       │ │
│  │                       │ │
│  └───────────────────────┘ │
│  Align QR code within frame│
└───────────────────────────┘

        ↓ on successful scan ↓

┌───────────────────────────┐
│  Select Coupon              │
│  Shift: 1st  ·  11:47 AM    │
│                              │
│  ○ Breakfast + Tea (used)   │
│  ● Meal          [OPEN NOW] │
│  ○ Tea (14:30-15:30)        │
│                              │
│  [       CONFIRM        ]   │
└───────────────────────────┘

        ↓ success ↓

┌───────────────────────────┐
│        ✅  SUCCESS!         │
│    Meal coupon redeemed     │
│      11:47:02 AM            │
│    Remaining Meal: 21       │
│                              │
│  ⭐⭐⭐⭐⭐  Rate this meal    │
│  [ Skip ]      [ Rate Now ] │
└───────────────────────────┘
```

### 4. Feedback Popup
```
┌───────────────────────────┐
│   Rate Your Meal            │
│   ⭐ ⭐ ⭐ ⭐ ☆               │
│   Tags:                     │
│   [Food ✓][Tea][Cleanliness]│
│   [Staff][Waiting Time]     │
│   Comment:                  │
│   ┌───────────────────────┐│
│   │ Rice was cold today   ││
│   └───────────────────────┘│
│   📷 Add Photo (optional)   │
│   [       SUBMIT        ]   │
└───────────────────────────┘
```

### 5. History / Monthly Usage
```
┌───────────────────────────┐
│  ← Coupon History  [Filter]│
│  Jul 2026                   │
│  ▓▓▓▓▓▓▓▓░░  B+Tea 20/26   │
│  ▓▓▓▓▓▓▓▓▓░  Meal  22/26   │
│  ▓▓▓▓▓▓▓▓▓▓  Tea   25/26   │
│  ────────────────────────  │
│  Jul 23  Meal      11:47 AM │
│  Jul 23  Breakfast  08:31 AM│
│  Jul 22  Tea        15:02 PM│
│  ...                        │
└───────────────────────────┘
```

## Canteen Real-Time Dashboard (large screen / tablet)

```
┌─────────────────────────────────────────────────────────────────┐
│  My Union Canteen — Live Scan Feed        Shift: 1st ▾  Dept: All▾│
├─────────────────────────────────────────────────────────────────┤
│ Photo │ Name          │ Clock # │ Dept     │ Coupon    │ Time    │
├───────┼───────────────┼─────────┼──────────┼───────────┼─────────┤
│ [img] │ Ramesh Kumar   │ W10234  │ Assembly │ 🍛 Meal   │ 11:47:02│
│ [img] │ Sunita Patil   │ W10891  │ Welding  │ 🍳 B+Tea  │ 11:46:40│
│ [img] │ Ajay Shinde    │ W10450  │ Assembly │ ☕ Tea    │ 11:46:12│
│  ...  │      ...       │   ...   │   ...    │    ...    │   ...   │
├─────────────────────────────────────────────────────────────────┤
│  Today: 842 Breakfast · 1,203 Meal · 977 Tea    ●  Live          │
└─────────────────────────────────────────────────────────────────┘
```

## Admin Web Dashboard

```
┌───────────────────────────────────────────────────────────────────┐
│ ☰ My Union Canteen — Admin        🔔  🌙  Manohar (Super Admin) ⌄  │
├──────────────┬────────────────────────────────────────────────────┤
│ Dashboard     │  KPI CARDS                                          │
│ Workers       │  [Daily Breakfast: 842] [Daily Meal: 1203] [Tea:977]│
│ Coupons       │  [Active Workers: 4,120] [Avg Rating: 4.3★]         │
│ Shifts        │                                                     │
│ Menu          │  ┌──────────────── Consumption Trend ─────────────┐│
│ Holidays      │  │        (line chart: last 30 days)              ││
│ Reports ▾     │  └─────────────────────────────────────────────────┘│
│  Daily        │  ┌──── Department-wise ────┐ ┌──── Shift-wise ─────┐│
│  Monthly      │  │      (bar chart)         │ │    (pie chart)      ││
│  Utilization  │  └──────────────────────────┘ └──────────────────────┘│
│  Financial    │                                                     │
│  Feedback     │  Recent Live Scans (same feed as canteen dashboard) │
│ Notifications │                                                     │
│ Audit Logs    │                                                     │
│ Settings      │                                                     │
└──────────────┴────────────────────────────────────────────────────┘
```

### Worker Management
```
┌───────────────────────────────────────────────────────────┐
│ Workers                          [+ Add Worker] [Import CSV]│
│ Search: [___________]  Dept: [All ▾]  Shift: [All ▾]        │
├─────────┬───────────────┬──────────┬────────┬───────────────┤
│ Clock#  │ Name           │ Dept     │ Shift  │ Status  │ ⋮   │
├─────────┼───────────────┼──────────┼────────┼─────────┼─────┤
│ W10234  │ Ramesh Kumar   │ Assembly │ 1st    │ Active  │ ⋮   │
│ ...     │ ...            │ ...      │ ...    │ ...     │ ⋮   │
└───────────────────────────────────────────────────────────┘
```

Design tokens (color, spacing, typography) live with the admin dashboard's Material theme (`admin-dashboard/src/theme.ts`) and the mobile app's theme provider (`mobile-app/src/theme`), both supporting light/dark mode.
