# Database Migration Fields Report

Tanggal: 2026-02-16

---

## Migration: 0001_01_01_000000_create_users_table.php

**⚠️ ISSUE: Migration ini menggabungkan 3 tabel dalam 1 file - MELANGGAR ATURAN!**

### Table: users

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| name | string | |
| email | string | unique |
| password | string | |
| role | enum | admin, user (default: user) |
| created_at | timestamp | |
| updated_at | timestamp | |

### Table: password_reset_tokens

| Field | Type | Constraints |
|-------|------|-------------|
| email | string | primary key |
| token | string | |
| created_at | timestamp | nullable |

### Table: sessions

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | primary key |
| user_id | unsignedBigInteger | nullable, indexed |
| ip_address | string | nullable, max 45 |
| user_agent | text | nullable |
| payload | longText | |
| last_activity | integer | indexed |

---

## Migration: 0001_01_01_000001_create_cache_table.php

### Table: cache

| Field | Type | Constraints |
|-------|------|-------------|
| key | string | primary key |
| value | text | |
| expiration | integer | |

---

## Migration: 0001_01_01_000002_create_jobs_table.php

### Table: jobs

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| queue | string | index |
| payload | longText | |
| attempts | unsignedInteger | |
| reserved_at | unsignedInteger | nullable |
| available_at | unsignedInteger | |
| created_at | timestamp | |

### Table: job_batches

| Field | Type | Constraints |
|-------|------|-------------|
| id | string | primary key |
| name | string | |
| total_jobs | integer | |
| pending_jobs | integer | |
| failed_jobs | integer | |
| failed_job_ids | text | |
| options | text | nullable |
| cancelled_at | integer | nullable |
| created_at | timestamp | |
| finished_at | integer | nullable |

### Table: failed_jobs

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| uuid | string | unique |
| connection | text | |
| queue | text | |
| payload | longText | |
| exception | longText | |
| failed_at | timestamp | |

---

## Migration: 2026_02_09_083206_create_personal_access_tokens_table.php

### Table: personal_access_tokens

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| tokenable_type | string | |
| tokenable_id | bigInteger | |
| name | string | |
| token | string | unique, 64 characters |
| abilities | text | nullable |
| last_used_at | timestamp | nullable |
| expires_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_084106_create_categories_table.php

### Table: categories

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| nama | string | unique |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_084107_create_produk_items_table.php

### Table: produk_items

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| nama | string | |
| deskripsi | text | nullable |
| category_id | unsignedBigInteger | nullable, foreign key -> categories, nullOnDelete |
| harga | integer | |
| stok | integer | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_084332_create_orders_table.php

### Table: orders

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| user_id | unsignedBigInteger | foreign key -> users, cascadeOnDelete |
| total_harga | integer | default 0 |
| status | enum | pending, paid, canceled (default: pending) |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_084356_create_order_details_table.php

### Table: order_details

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | foreign key -> orders, cascadeOnDelete |
| produk_item_id | unsignedBigInteger | foreign key -> produk_items, cascadeOnDelete |
| qty | integer | |
| harga | integer | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_090000_create_payments_table.php

### Table: payments

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | unique, foreign key -> orders, cascadeOnDelete |
| metode | string | nullable |
| status | enum | pending, success, failed (default: pending) |
| paid_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** idx_payments_status_paid_at (status, paid_at)

---

## Migration: 2026_02_09_090001_create_payment_amounts_table.php

### Table: payment_amounts

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| payment_id | unsignedBigInteger | unique, foreign key -> payments, cascadeOnDelete |
| currency_code | string | default 'IDR', length 3 |
| amount_minor | bigInteger | unsigned, default 0 |
| fee_minor | bigInteger | unsigned, default 0 |
| net_amount_minor | bigInteger | unsigned, default 0 |
| refund_amount_minor | bigInteger | unsigned, default 0 |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_09_090002_create_payment_gateways_table.php

### Table: payment_gateways

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| payment_id | unsignedBigInteger | unique, foreign key -> payments, cascadeOnDelete |
| provider | string | nullable |
| provider_txn_id | string | nullable |
| idempotency_key | string | nullable, unique |
| gateway_status | string | nullable |
| gateway_code | string | nullable |
| gateway_message | text | nullable |
| authorized_at | timestamp | nullable |
| captured_at | timestamp | nullable |
| failed_at | timestamp | nullable |
| refunded_at | timestamp | nullable |
| reconciled_at | timestamp | nullable |
| reconciliation_batch_id | string | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Constraints:** uq_payment_gateway_provider_txn (provider, provider_txn_id)

---

## Migration: 2026_02_16_010300_create_wishlists_table.php

### Table: wishlists

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| user_id | unsignedBigInteger | foreign key -> users, cascadeOnDelete |
| produk_item_id | unsignedBigInteger | foreign key -> produk_items, cascadeOnDelete |
| created_at | timestamp | |
| updated_at | timestamp | |

**Unique:** (user_id, produk_item_id)

---

## Migration: 2026_02_16_020100_create_produk_item_frontends_table.php

### Table: produk_item_frontends

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| produk_item_id | unsignedBigInteger | foreign key -> produk_items |
| view_count | integer | default 0 |
| last_viewed_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_16_020200_create_order_shippings_table.php

### Table: order_shippings

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | foreign key -> orders, cascadeOnDelete |
| recipient_name | string | |
| phone | string | |
| address_line1 | string | |
| address_line2 | string | nullable |
| city | string | |
| province | string | |
| postal_code | string | |
| country | string | default 'ID' |
| shipping_method | string | nullable |
| tracking_number | string | nullable |
| shipped_at | timestamp | nullable |
| delivered_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_16_020300_create_payment_details_table.php

### Table: payment_details

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| payment_id | unsignedBigInteger | unique, foreign key -> payments, cascadeOnDelete |
| detail | json | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_16_040000_create_social_accounts_table.php

### Table: social_accounts

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| user_id | unsignedBigInteger | foreign key -> users, cascadeOnDelete |
| provider_name | string | |
| provider_id | string | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_16_040100_create_promo_codes_table.php

### Table: promo_codes

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| code | string | unique, length 64 |
| discount_type | enum | fixed_minor, percent |
| discount_value | unsignedBigInteger | |
| max_discount_minor | unsignedBigInteger | nullable |
| min_order_minor | unsignedBigInteger | default 0 |
| usage_limit | unsignedInteger | nullable |
| used_count | unsignedInteger | default 0 |
| is_active | boolean | default true |
| starts_at | timestamp | nullable |
| ends_at | timestamp | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** idx_promo_active_window (is_active, starts_at, ends_at)

---

## Migration: 2026_02_16_040101_create_order_promotions_table.php

### Table: order_promotions

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | foreign key -> orders, cascadeOnDelete |
| promo_code_id | unsignedBigInteger | nullable, foreign key -> promo_codes, nullOnDelete |
| promo_code | string | length 64 |
| discount_minor | unsignedBigInteger | default 0 |
| metadata | json | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Constraints:** uq_order_promotion_order (order_id)
**Index:** idx_order_promo_code_created (promo_code_id, created_at)

---

## Migration: 2026_02_16_040200_create_product_reviews_table.php

### Table: product_reviews

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| produk_item_id | unsignedBigInteger | foreign key -> produk_items, cascadeOnDelete |
| user_id | unsignedBigInteger | foreign key -> users, cascadeOnDelete |
| rating | integer | |
| title | string | |
| comment | text | |
| is_verified_purchase | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## Migration: 2026_02_16_060000_create_order_amounts_table.php

### Table: order_amounts

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | unique, foreign key -> orders, cascadeOnDelete |
| subtotal_minor | bigInteger | unsigned, default 0 |
| shipping_minor | bigInteger | unsigned, default 0 |
| discount_minor | bigInteger | unsigned, default 0 |
| tax_minor | bigInteger | unsigned, default 0 |
| total_minor | bigInteger | unsigned, default 0 |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** idx_order_amounts_order_id (order_id), idx_order_amounts_created_at (created_at)

---

## Migration: 2026_02_16_060100_create_order_financials_table.php

### Table: order_financials

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | unique, foreign key -> orders, cascadeOnDelete |
| financial_status | enum | pending, paid, partially_refunded, refunded, failed, cancelled |
| refunded_at | timestamp | nullable |
| refund_reason | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** idx_order_financials_order_id (order_id), idx_order_financials_status (financial_status), idx_order_financials_created_at (created_at)

---

## Migration: 2026_02_16_060200_create_order_fulfillments_table.php

### Table: order_fulfillments

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigInteger | primary key, auto-increment |
| order_id | unsignedBigInteger | unique, foreign key -> orders, cascadeOnDelete |
| fulfillment_status | enum | unfulfilled, processing, shipped, completed, cancelled, returned |
| processing_at | timestamp | nullable |
| shipped_at | timestamp | nullable |
| completed_at | timestamp | nullable |
| canceled_at | timestamp | nullable |
| cancel_reason | text | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

**Index:** idx_order_fulfillments_order_id (order_id), idx_order_fulfillments_status (fulfillment_status), idx_order_fulfillments_created_at (created_at)

---

## Ringkasan

**Total Migration: 17 file**

**ISU YANG DITEMUKAN:**

1. **Migration 0001_01_01_000000_create_users_table.php** - Menggabungkan 3 tabel dalam 1 file:
   - users
   - password_reset_tokens
   - sessions
   
   Ini MELANGGAR aturan "Jangan menggabungkan beberapa tabel dalam satu file migration"

---

## Daftar Tabel (19 tabel)

| No | Nama Tabel | Jumlah Field |
|----|------------|--------------|
| 1 | users | 6 |
| 2 | password_reset_tokens | 3 |
| 3 | sessions | 6 |
| 4 | cache | 3 |
| 5 | jobs | 7 |
| 6 | job_batches | 10 |
| 7 | failed_jobs | 7 |
| 8 | personal_access_tokens | 10 |
| 9 | categories | 4 |
| 10 | produk_items | 7 |
| 11 | orders | 6 |
| 12 | order_details | 7 |
| 13 | payments | 7 |
| 14 | payment_amounts | 8 |
| 15 | payment_gateways | 17 |
| 16 | wishlists | 5 |
| 17 | produk_item_frontends | 6 |
| 18 | order_shippings | 15 |
| 19 | payment_details | 5 |
| 20 | social_accounts | 5 |
| 21 | promo_codes | 13 |
| 22 | order_promotions | 8 |
| 23 | product_reviews | 8 |
| 24 | order_amounts | 8 |
| 25 | order_financials | 7 |
| 26 | order_fulfillments | 9 |
