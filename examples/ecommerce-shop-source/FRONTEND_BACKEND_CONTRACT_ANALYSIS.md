# Frontend-Backend API Contract Analysis

## Executive Summary

This document analyzes the alignment between frontend API contracts (TypeScript/Zod schemas) and backend JSON responses (PHP Laravel Resources).

**Status: Multiple mismatches found that need to be addressed.**

---

## ✅ MATCHING CONTRACTS

### 1. Order Detail Items
- **Backend**: `OrderDetailResource` returns items with structure: `{ id, produk_item_id, produk: { id, nama, gambar, image_url }, qty, harga, subtotal }`
- **Frontend**: OrderApiContract expects exact same structure
- **Status**: ✅ MATCH

### 2. Promo Apply/Remove
- **Backend**: `PromoController` returns `OrderResource` (full order with promotion)
- **Frontend**: `PromoApiContract.Schema` is identical to Order schema
- **Status**: ✅ MATCH

---

## ❌ MISMATCHES FOUND

### 1. AUTH - Missing `role` Field

**File**: `frontend/src/features/auth/contracts/api-contract.ts`

**Backend Response** (AuthController.php - login method):
```
json
{
  "token": "...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"  // ← This field is returned
  }
}
```

**Frontend Contract** (ProfileSchema):
```
typescript
export const ProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  // role is MISSING!
});
```

**Fix Required**: Add `role: z.string()` to ProfileSchema

---

### 2. CATEGORY - Response Wrapper Mismatch

**File**: `frontend/src/features/category/contracts/api-contract.ts`

**Backend Response** (CategoryController.php):
```
json
{
  "data": [
    { "id": 1, "nama": "Electronics" },
    { "id": 2, "nama": "Clothing" }
  ]
}
```

**Frontend Contract** (IndexSchema):
```
typescript
export const IndexSchema = z.array(CategorySchema)
// Expects: [{ id, nama }, ...]
// But gets: { data: [{ id, nama }, ...] }
```

**Fix Required**: Either:
- Option A: Update frontend to handle `{ data: [...] }` wrapper
- Option B: Update backend to return plain array `[...]`

---

### 3. WISHLIST/PRODUK - Major Field Name Mismatch

**File**: `frontend/src/features/wishlist/contracts/api-contract.ts`

**Backend Response** (ProdukItemResource.php):
```
json
{
  "id": 1,
  "name": "Product Name",           // NOT "nama"
  "description": "Description",     // NOT "deskripsi"
  "image": "path/to/image.jpg",     // NOT "gambar"
  "image_url": "http://...",
  "category_id": 1,
  "category_name": "Electronics",    // NOT "kategori"
  "price": 100000,                   // NOT "harga"
  "stock": 50,                       // NOT "stok"
  "rating": 4.5,
  "review_count": 10                 // NOT "jumlah_review"
}
```

**Frontend Contract** (Wishlist Schema):
```
typescript
export const Schema = z.object({
  id: z.number(),
  nama: z.string(),           // Should be "name"
  deskripsi: z.string(),      // Should be "description"
  gambar: z.string(),         // Should be "image"
  image_url: z.string(),
  category_id: z.number(),
  kategori: z.string(),       // Should be "category_name"
  harga: z.number(),          // Should be "price"
  stok: z.number(),           // Should be "stock"
  rating: z.number(),
  jumlah_review: z.number(),  // Should be "review_count"
});
```

**Fix Required**: Update frontend schema to match backend field names

---

### 4. PAYMENT - Missing Response Schema

**File**: `frontend/src/features/payment/contracts/api-contract.ts`

**Backend Response** (PaymentResource.php):
```
json
{
  "id": 1,
  "order_id": 1,
  "invoice_number": "INV-20260209-00000001",
  "metode": "midtrans",
  "detail": { ... },
  "status": "success",
  "paid_at": "2026-02-09T10:00:00Z",
  "provider": "midtrans",
  "provider_txn_id": "txn_123",
  "gateway_status": "settlement",
  "amount_minor": 150000,
  "refund_amount_minor": 0,
  "gateway": {
    "name": "midtrans",
    "order_id": "ORDER-001",
    "token": "...",
    "redirect_url": "https://..."
  },
  "total_harga": 150000
}
```

**Frontend Contract**: Only defines request schema (PaymentSchema), no response validation

**Fix Required**: Add PaymentResponseSchema to validate incoming payment data

---

## Recommendations

### Priority 1 (Critical - Causes Runtime Errors):
1. Wishlist/Produk field name mismatch - MUST fix for app to work
2. Auth role field - recommended for profile completeness

### Priority 2 (Important - Data Consistency):
3. Category response wrapper - affects data parsing

### Priority 3 (Enhancement):
4. Payment response schema - add for type safety

---

## Files to Review

### Backend Files:
- `app/Http/Controllers/Auth/AuthController.php`
- `app/Http/Controllers/CategoryController.php`
- `app/Http/Resources/ProdukItemResource.php`
- `app/Http/Resources/PaymentResource.php`

### Frontend Files:
- `frontend/src/features/auth/contracts/api-contract.ts`
- `frontend/src/features/category/contracts/api-contract.ts`
- `frontend/src/features/wishlist/contracts/api-contract.ts`
- `frontend/src/features/payment/contracts/api-contract.ts`
