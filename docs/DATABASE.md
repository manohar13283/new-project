# Database Schema — PostgreSQL

## ER Diagram

```mermaid
erDiagram
    FACTORY ||--o{ DEPARTMENT : has
    FACTORY ||--o{ CANTEEN : has
    CANTEEN ||--o{ QR_CODE : displays
    DEPARTMENT ||--o{ WORKER : employs
    SHIFT ||--o{ SHIFT_MEAL_WINDOW : defines
    SHIFT ||--o{ WORKER : "assigned to"
    WORKER ||--o{ MONTHLY_COUPON_ALLOCATION : receives
    WORKER ||--o{ COUPON_TRANSACTION : redeems
    WORKER ||--o{ NOTIFICATION_RECIPIENT : receives
    WORKER ||--o{ DEVICE_SESSION : "logs in from"
    COUPON_TRANSACTION ||--o| FEEDBACK : "may have"
    COUPON_TRANSACTION }o--|| SHIFT_MEAL_WINDOW : "validated against"
    CANTEEN ||--o{ MENU_ITEM : serves
    CANTEEN ||--o{ HOLIDAY : observes
    ADMIN_USER ||--o{ AUDIT_LOG : performs
    ADMIN_USER }o--|| ROLE : has

    FACTORY {
        uuid id PK
        string name
        timestamptz created_at
    }
    CANTEEN {
        uuid id PK
        uuid factory_id FK
        string name
        string location
    }
    QR_CODE {
        uuid id PK
        uuid canteen_id FK
        string code_value UK
        boolean active
        timestamptz created_at
    }
    DEPARTMENT {
        uuid id PK
        uuid factory_id FK
        string name
    }
    SHIFT {
        uuid id PK
        string code "1ST | 2ND | 3RD"
        string name
    }
    SHIFT_MEAL_WINDOW {
        uuid id PK
        uuid shift_id FK
        string coupon_type "BREAKFAST_TEA | MEAL | TEA"
        time start_time
        time end_time
        boolean crosses_midnight
    }
    WORKER {
        uuid id PK
        string clock_number UK
        string full_name
        string password_hash
        uuid department_id FK
        uuid shift_id FK
        uuid factory_id FK
        string phone
        string photo_url
        string language_pref "en | mr"
        boolean is_active
        timestamptz created_at
    }
    MONTHLY_COUPON_ALLOCATION {
        uuid id PK
        uuid worker_id FK
        int year
        int month
        int breakfast_tea_total
        int breakfast_tea_used
        int meal_total
        int meal_used
        int tea_total
        int tea_used
        timestamptz generated_at
    }
    COUPON_TRANSACTION {
        uuid id PK
        uuid worker_id FK
        uuid shift_id FK
        uuid shift_meal_window_id FK
        uuid canteen_id FK
        uuid qr_code_id FK
        string coupon_type
        date business_date
        timestamptz scanned_at
        string status "SUCCESS | REJECTED"
        string reject_reason
        string device_id
    }
    FEEDBACK {
        uuid id PK
        uuid transaction_id FK
        uuid worker_id FK
        int rating "1-5"
        text comment
        jsonb categories
        string photo_url
        timestamptz created_at
    }
    MENU_ITEM {
        uuid id PK
        uuid canteen_id FK
        date served_date
        uuid shift_id FK
        string coupon_type
        string description
    }
    HOLIDAY {
        uuid id PK
        uuid factory_id FK
        date holiday_date
        string reason
    }
    NOTIFICATION {
        uuid id PK
        string title
        text body
        string audience_filter
        timestamptz sent_at
    }
    NOTIFICATION_RECIPIENT {
        uuid id PK
        uuid notification_id FK
        uuid worker_id FK
        boolean read
    }
    DEVICE_SESSION {
        uuid id PK
        uuid worker_id FK
        string device_id
        string refresh_token_hash
        timestamptz last_seen_at
        timestamptz expires_at
    }
    ADMIN_USER {
        uuid id PK
        string email UK
        string password_hash
        uuid role_id FK
        boolean is_active
    }
    ROLE {
        uuid id PK
        string name "SUPER_ADMIN | ADMIN | CANTEEN_STAFF"
    }
    AUDIT_LOG {
        uuid id PK
        uuid admin_user_id FK
        string action
        string entity_type
        uuid entity_id
        jsonb before
        jsonb after
        timestamptz created_at
    }
```

## Key Constraints

- `worker.clock_number` — `UNIQUE`, used as login identifier.
- `monthly_coupon_allocation` — `UNIQUE (worker_id, year, month)`; created idempotently by the monthly cron job.
- `coupon_transaction` — partial unique index enforcing **max one SUCCESS transaction per (worker_id, coupon_type, business_date)**:
  ```sql
  CREATE UNIQUE INDEX uq_one_success_per_type_per_day
    ON coupon_transaction (worker_id, coupon_type, business_date)
    WHERE status = 'SUCCESS';
  ```
  This index is the ultimate source of truth for duplicate-scan prevention — even under concurrent requests, the second `INSERT` fails at the database level and is caught by the service layer as "already used today."
- Coupon balance decrements happen inside the same DB transaction as the `coupon_transaction` insert, using `SELECT ... FOR UPDATE` on the `monthly_coupon_allocation` row to serialize concurrent redemptions from the same worker.
- `shift_meal_window.crosses_midnight` handles the 3rd-shift windows (01:30–02:30, 03:30–04:30) where `business_date` is pinned to the shift's operational day rather than the calendar day of the scan.

## Indexes for Reporting

```sql
CREATE INDEX idx_txn_business_date ON coupon_transaction (business_date);
CREATE INDEX idx_txn_worker ON coupon_transaction (worker_id);
CREATE INDEX idx_txn_department_date ON coupon_transaction (business_date) INCLUDE (worker_id);
CREATE INDEX idx_worker_department ON worker (department_id);
CREATE INDEX idx_feedback_created_at ON feedback (created_at);
```

## Multi-Factory / Multi-Canteen Readiness

`factory_id` and `canteen_id` foreign keys are present on `department`, `worker`, `qr_code`, `menu_item`, and `holiday` from day one, so a future multi-factory or multi-canteen rollout is a query-scoping change, not a schema migration.
