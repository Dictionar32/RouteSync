# Frontend TypeScript Types Fixes

## Task: Fix mismatches between Frontend TypeScript types and API.md/Database

### Completed:
- [x] Analyzed frontend types, API.md, and database migrations
- [x] Identified the mismatches
- [x] Got user confirmation to proceed
- [x] Fixed Category types (category-read.ts)
- [x] Fixed Order types (order-read.ts)

### Summary of Changes Made:

#### 1. Category Types (category-read.ts) ✅
- Changed `nama_kategori` to `nama`
- Made fields optional: `slug?`, `deskripsi?`, `created_at?`, `updated_at?`

#### 2. Order Types (order-read.ts) ✅
**OrderDetail:**
- Changed `produk_id` to `produk_item_id`
- Changed `quantity` to `qty`
- Made some fields optional

**Order:**
- Removed flat fields: `subtotal`, `shipping_cost`, `discount`, `total`, `payment_status`, `order_number`
- Added nested `amount` object: `{ subtotal_minor, shipping_minor, discount_minor, tax_minor, total_minor }`
- Added nested `financial` object: `{ financial_status, refunded_at?, refund_reason? }`
- Added `total_harga` field
- Added new types: `OrderAmount`, `OrderFinancial`, `OrderShipping`
- Updated `OrderFulfillment` with proper fields based on database schema

### Files Modified:
1. frontend/src/features/category/types/category-read.ts
2. frontend/src/features/order/types/order-read.ts
