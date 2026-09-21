# Database Documentation

This document provides a comprehensive overview of all database tables in the LKS E-Commerce project.

## Table of Contents
1. [Core Tables](#core-tables)
2. [Order Tables](#order-tables)
3. [Payment Tables](#payment-tables)
4. [Promotion & Review Tables](#promotion--review-tables)
5. [User Tables](#user-tables)
6. [Laravel Default Tables](#laravel-default-tables)

---

## Core Tables

### 1. users
**Description:** Stores user accounts for the application.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique user identifier |
| name | varchar(255) | NOT NULL | User's full name |
| email | varchar(255) | UNIQUE, NOT NULL | User's email address |
| password | varchar(255) | NOT NULL | Hashed password |
| role | enum('user', 'admin') | DEFAULT 'user' | User role |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- HasMany: orders, wishlists, product_reviews, social_accounts

---

### 2. categories
**Description:** Product categories.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique category identifier |
| nama | varchar(255) | NOT NULL | Category name |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- HasMany: produk_items

---

### 3. produk_items
**Description:** Product items available for sale.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique product identifier |
| nama | varchar(255) | NOT NULL | Product name |
| deskripsi | text | NULLABLE | Product description |
| harga | int | NOT NULL | Product price in IDR |
| stok | int | DEFAULT 0 | Stock quantity |
| category_id | bigint | FOREIGN KEY -> categories.id | Category reference |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: category
- HasMany: order_details, produk_item_frontends, wishlists, product_reviews

---

### 4. produk_item_frontends
**Description:** Frontend-specific product data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| produk_item_id | bigint | FOREIGN KEY -> produk_items.id | Product reference |
| gambar | varchar(255) | NULLABLE | Product image URL |
| rating | decimal(3,2) | DEFAULT 0 | Average rating |
| jumlah_review | int | DEFAULT 0 | Number of reviews |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: produk_item

---

## Order Tables

### 5. orders
**Description:** Main order table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique order identifier |
| user_id | bigint | FOREIGN KEY -> users.id | User who placed the order |
| total_harga | int | DEFAULT 0 | Total order amount in IDR |
| status | enum('pending','paid','canceled') | DEFAULT 'pending' | Order status |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: user
- HasMany: order_details, order_amounts, order_financials, order_fulfillments, order_promotions, order_shippings, payments

---

### 6. order_details
**Description:** Individual items in an order.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | FOREIGN KEY -> orders.id | Order reference |
| produk_item_id | bigint | FOREIGN KEY -> produk_items.id | Product reference |
| qty | int | NOT NULL | Quantity ordered |
| harga | int | NOT NULL | Price per unit |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order, produk_item

---

### 7. order_amounts
**Description:** Monetary breakdown of an order.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | UNIQUE, FOREIGN KEY -> orders.id | Order reference |
| subtotal_minor | bigint | DEFAULT 0 | Subtotal in minor units (cents) |
| shipping_minor | bigint | DEFAULT 0 | Shipping cost in minor units |
| discount_minor | bigint | DEFAULT 0 | Discount in minor units |
| tax_minor | bigint | DEFAULT 0 | Tax in minor units |
| total_minor | bigint | DEFAULT 0 | Total in minor units |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order

---

### 8. order_financials
**Description:** Financial status tracking for orders.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | UNIQUE, FOREIGN KEY -> orders.id | Order reference |
| financial_status | enum('pending','paid','partially_refunded','refunded','failed','cancelled') | DEFAULT 'pending' | Financial status |
| refunded_at | timestamp | NULLABLE | Refund timestamp |
| refund_reason | text | NULLABLE | Reason for refund |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order

---

### 9. order_fulfillments
**Description:** Fulfillment/shipping status tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | UNIQUE, FOREIGN KEY -> orders.id | Order reference |
| fulfillment_status | enum('unfulfilled','processing','shipped','completed','cancelled','returned') | DEFAULT 'unfulfilled' | Fulfillment status |
| processing_at | timestamp | NULLABLE | Processing timestamp |
| shipped_at | timestamp | NULLABLE | Shipped timestamp |
| completed_at | timestamp | NULLABLE | Completed timestamp |
| canceled_at | timestamp | NULLABLE | Canceled timestamp |
| cancel_reason | text | NULLABLE | Reason for cancellation |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order

---

### 10. order_promotions
**Description:** Promo codes applied to orders.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | FOREIGN KEY -> orders.id | Order reference |
| promo_code_id | bigint | NULLABLE, FOREIGN KEY -> promo_codes.id | Promo code reference |
| promo_code | varchar(64) | NOT NULL | Promo code string |
| discount_minor | bigint | DEFAULT 0 | Discount amount in minor units |
| metadata | json | NULLABLE | Additional metadata |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order, promo_code

---

### 11. order_shippings
**Description:** Shipping address for orders.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | UNIQUE, FOREIGN KEY -> orders.id | Order reference |
| nama | varchar(255) | NULLABLE | Recipient name |
| telepon | varchar(255) | NULLABLE | Contact phone |
| alamat | text | NULLABLE | Shipping address |
| kota | varchar(255) | NULLABLE | City |
| kode_pos | varchar(255) | NULLABLE | Postal code |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order

---

## Payment Tables

### 12. payments
**Description:** Payment transactions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| order_id | bigint | UNIQUE, FOREIGN KEY -> orders.id | Order reference |
| metode | varchar(255) | NULLABLE | Payment method |
| status | enum('pending','success','failed') | DEFAULT 'pending' | Payment status |
| paid_at | timestamp | NULLABLE | Payment completion timestamp |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: order
- HasMany: payment_amounts, payment_details, payment_gateways

---

### 13. payment_amounts
**Description:** Payment amount details.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| payment_id | bigint | FOREIGN KEY -> payments.id | Payment reference |
| amount_minor | bigint | NOT NULL | Amount in minor units |
| currency | varchar(3) | DEFAULT 'IDR' | Currency code |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: payment

---

### 14. payment_details
**Description:** Additional payment details.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| payment_id | bigint | FOREIGN KEY -> payments.id | Payment reference |
| details | json | NULLABLE | Additional details |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: payment

---

### 15. payment_gateways
**Description:** Payment gateway integration data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| payment_id | bigint | UNIQUE, FOREIGN KEY -> payments.id | Payment reference |
| provider | varchar(255) | NULLABLE | Gateway provider name |
| provider_txn_id | varchar(255) | NULLABLE | Provider transaction ID |
| idempotency_key | varchar(255) | UNIQUE, NULLABLE | Idempotency key |
| gateway_status | varchar(255) | NULLABLE | Gateway status |
| gateway_code | varchar(255) | NULLABLE | Gateway response code |
| gateway_message | text | NULLABLE | Gateway response message |
| authorized_at | timestamp | NULLABLE | Authorization timestamp |
| captured_at | timestamp | NULLABLE | Capture timestamp |
| failed_at | timestamp | NULLABLE | Failure timestamp |
| refunded_at | timestamp | NULLABLE | Refund timestamp |
| reconciled_at | timestamp | NULLABLE | Reconciliation timestamp |
| reconciliation_batch_id | varchar(255) | NULLABLE | Batch ID for reconciliation |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: payment

---

## Promotion & Review Tables

### 16. promo_codes
**Description:** Promotional codes.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| code | varchar(64) | UNIQUE, NOT NULL | Promo code string |
| discount_type | enum('fixed_minor','percent') | NOT NULL | Discount type |
| discount_value | int | NOT NULL | Discount value |
| max_discount_minor | int | NULLABLE | Maximum discount for percentage |
| min_order_minor | int | DEFAULT 0 | Minimum order amount |
| usage_limit | int | NULLABLE | Maximum usage count |
| is_active | boolean | DEFAULT true | Active status |
| starts_at | timestamp | NULLABLE | Start date |
| ends_at | timestamp | NULLABLE | End date |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- HasMany: order_promotions

---

### 17. product_reviews
**Description:** Product reviews by users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| user_id | bigint | FOREIGN KEY -> users.id | User who wrote the review |
| produk_item_id | bigint | FOREIGN KEY -> produk_items.id | Product being reviewed |
| rating | int | NOT NULL | Rating (1-5) |
| comment | text | NULLABLE | Review comment |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: user, produk_item

---

## User Tables

### 18. wishlists
**Description:** User wishlists.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| user_id | bigint | FOREIGN KEY -> users.id | User reference |
| produk_item_id | bigint | FOREIGN KEY -> produk_items.id | Product reference |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: user, produk_item

---

### 19. social_accounts
**Description:** Social login accounts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | bigint | PRIMARY KEY, AUTO INCREMENT | Unique identifier |
| user_id | bigint | FOREIGN KEY -> users.id | User reference |
| provider | varchar(32) | NOT NULL | OAuth provider (google, facebook, apple) |
| provider_user_id | varchar(191) | NOT NULL | Provider user ID |
| email | varchar(255) | NULLABLE | User email from provider |
| avatar_url | varchar(255) | NULLABLE | Profile picture URL |
| created_at | timestamp | | Creation timestamp |
| updated_at | timestamp | | Last update timestamp |

**Relationships:**
- BelongsTo: user

---

## Laravel Default Tables

### 20. personal_access_tokens
**Description:** Laravel Sanctum tokens.

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigint | PRIMARY KEY |
| tokenable_type | varchar(255) | NOT NULL |
| tokenable_id | bigint | NOT NULL |
| name | varchar(255) | NOT NULL |
| token | varchar(64) | UNIQUE, NOT NULL |
| abilities | json | NULLABLE |
| last_used_at | timestamp | NULLABLE |
| expires_at | timestamp | NULLABLE |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 21. password_reset_tokens
**Description:** Password reset tokens.

| Field | Type | Constraints |
|-------|------|-------------|
| email | varchar(255) | PRIMARY KEY |
| token | varchar(255) | NOT NULL |
| created_at | timestamp | |

---

### 22. sessions
**Description:** User sessions.

| Field | Type | Constraints |
|-------|------|-------------|
| id | varchar(255) | PRIMARY KEY |
| user_id | bigint | NULLABLE |
| ip_address | varchar(45) | NULLABLE |
| user_agent | text | NULLABLE |
| payload | longtext | NOT NULL |
| last_activity | int | NOT NULL |

---

### 23. cache
**Description:** Cache storage.

| Field | Type | Constraints |
|-------|------|-------------|
| key | varchar(255) | PRIMARY KEY |
| value | longtext | NOT NULL |
| expiration | int | NOT NULL |

---

### 24. jobs
**Description:** Laravel job queue.

| Field | Type | Constraints |
|-------|------|-------------|
| id | bigint | PRIMARY KEY |
| queue | varchar(255) | NOT NULL |
| payload | longtext | NOT NULL |
| attempts | tinyint | NOT NULL |
| reserved_at | int | NULLABLE |
| available_at | int | NOT NULL |
| created_at | int | NOT NULL |

---

## Seeder Information

### Existing Seeders:
1. **DatabaseSeeder** - Seeds users (admin & test user)
2. **ProdukItemSeeder** - Seeds categories, produk_items, and produk_item_frontends
3. **PromoCodeSeeder** - Seeds promo codes
4. **OrderSeeder** - Seeds orders with order details, amounts, financials, fulfillments, promotions, and shippings
5. **PaymentSeeder** - Seeds payments with amounts, details, and gateways
6. **WishlistSeeder** - Seeds user wishlists
7. **ProductReviewSeeder** - Seeds product reviews
8. **SocialAccountSeeder** - Seeds social login accounts

### Running Seeders:
```
bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=OrderSeeder

# Fresh migrate and seed
php artisan migrate:fresh --seed
```

---

## Relationships Diagram

```
users
  ├── orders (1:N)
  ├── wishlists (1:N)
  ├── product_reviews (1:N)
  └── social_accounts (1:N)

categories
  └── produk_items (1:N)

produk_items
  ├── order_details (1:N)
  ├── wishlists (1:N)
  ├── product_reviews (1:N)
  └── produk_item_frontends (1:1)

orders
  ├── order_details (1:N)
  ├── order_amounts (1:1)
  ├── order_financials (1:1)
  ├── order_fulfillments (1:1)
  ├── order_promotions (1:N)
  ├── order_shippings (1:1)
  └── payments (1:N)

payments
  ├── payment_amounts (1:1)
  ├── payment_details (1:1)
  └── payment_gateways (1:1)

promo_codes
  └── order_promotions (1:N)
