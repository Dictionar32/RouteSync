# API Response Documentation - LKS E-Commerce

This document provides comprehensive JSON response documentation for all API endpoints in the LKS E-Commerce project.

## Base URL
```
http://localhost:8000/api
```

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Public Endpoints](#public-endpoints)
3. [Protected Endpoints](#protected-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Response Type Explanations](#response-type-explanations)
6. [Complete Endpoint List](#complete-endpoint-list)

---

## Authentication Endpoints

### POST /api/register
Register a new user account.

**Request Body:**
```
json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201 Created):**
```
json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123def456..."
}
```

**Penjelasan/Explanation:**
- `message`: Konfirmasi berhasil registrasi
- `user`: Objek berisi data user yang baru dibuat
- `token`: JWT token untuk autentikasi (gunakan pada header request berikutnya)

---

### POST /api/login
Login dengan email dan password.

**Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK) - Success:**
```
json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123def456..."
}
```

**Response (401 Unauthorized) - Failed:**
```
json
{
  "message": "Invalid credentials"
}
```

**Penjelasan/Explanation:**
- `message`: Status login
- `user`: Data user yang berhasil login
- `token`: Bearer token untuk akses endpoint protected

---

### POST /api/logout
Logout user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Logged out successfully"
}
```

---

## Public Endpoints

### GET /api/categories
Get all product categories.

**Response (200 OK):**
```
json
{
  "data": [
    {
      "id": 1,
      "nama": "Audio"
    },
    {
      "id": 2,
      "nama": "Smartphone"
    },
    {
      "id": 3,
      "nama": "Laptop"
    }
  ]
}
```

**Penjelasan/Explanation:**
- `data`: Array berisi semua kategori produk
- `id`: Unique identifier untuk kategori
- `nama`: Nama kategori (sudah sesuai dengan database dan frontend types)

---

### GET /api/produk
Get all products with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| search | string | Search by name |
| category_id | integer | Filter by category |

**Response (200 OK):**
```
json
{
  "data": [
    {
      "id": 1,
      "nama": "Apple AirPods Pro",
      "deskripsi": "Earbuds premium dengan active noise cancellation.",
      "gambar": "produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg",
      "image_url": "http://127.0.0.1:8000/storage/produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg",
      "category_id": 1,
      "kategori": "Audio",
      "harga": 3499000,
      "stok": 20,
      "rating": 4.8,
      "jumlah_review": 125
    },
    {
      "id": 2,
      "nama": "Samsung Galaxy S22",
      "deskripsi": "Smartphone flagship dengan kamera tajam dan performa cepat.",
      "gambar": "produk/ChatGPT Image 15 Feb 2026, 10.21.58.png",
      "image_url": "http://127.0.0.1:8000/storage/produk/ChatGPT Image 15 Feb 2026, 10.21.58.png",
      "category_id": 2,
      "kategori": "Smartphone",
      "harga": 11999000,
      "stok": 15,
      "rating": 4.6,
      "jumlah_review": 99
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "to": 9,
    "total": 9
  }
}
```

**Penjelasan/Explanation:**
- `data`: Array produk yang dikembalikan
- `meta`: Informasi pagination
- `nama`: Nama produk (sudah sesuai dengan frontend)
- `category_id`: ID kategori produk (sudah sesuai)
- `kategori`: Nama kategori (nested) - TAMBAHAN dari API
- `image_url`: URL lengkap gambar produk - TAMBAHAN dari API
- `gambar`: Path gambar relatif
- `rating`: Rating rata-rata produk (decimal)
- `jumlah_review`: Total jumlah review produk

---

### GET /api/produk/{id}
Get product details by ID.

**Response (200 OK):**
```
json
{
  "id": 1,
  "nama": "Apple AirPods Pro",
  "deskripsi": "Earbuds premium dengan active noise cancellation",
  "harga": 3499000,
  "stok": 20,
  "category_id": 1,
  "gambar": "produk/airpods-pro.jpg",
  "rating": 4.8,
  "jumlah_review": 125
}
```

**Response (404 Not Found):**
```
json
{
  "message": "Product not found"
}
```

---

### GET /api/produk/{id}/reviews
Get reviews for a product.

**Response (200 OK):**
```
json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "produk_item_id": 1,
      "rating": 5,
      "comment": "Produk ini luar biasa!",
      "created_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "produk_item_id": 1,
      "rating": 4,
      "comment": "Kualitas suara bagus, tapi mahal",
      "created_at": "2026-02-14T15:30:00Z"
    }
  ]
}
```

**Penjelasan/Explanation:**
- `produk_item_id`: ID produk (sudah sesuai dengan frontend types)
- `rating`: Rating yang diberikan user (1-5)
- `comment`: Komentar review

---

## Protected Endpoints

### GET /api/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

### PUT /api/profile
Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "name": "John Updated"
}
```

**Response (200 OK):**
```
json
{
  "id": 1,
  "name": "John Updated",
  "email": "john@example.com"
}
```

---

## Order & Cart Endpoints

### GET /api/orders
Get all orders for the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number |
| per_page | integer | Items per page |
| status | string | Filter by status |

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "total_harga": 5000000,
      "status": "pending",
      "created_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": 1,
      "total_harga": 3499000,
      "status": "processing",
      "created_at": "2026-02-14T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "per_page": 15,
    "to": 5,
    "total": 5
  }
}
```

**Penjelasan/Explanation:**
- `total_harga`: Total harga order dalam Rupiah (bukan dalam minor units)
- `status`: Status order (pending, processing, shipped, delivered, cancelled)

---

### GET /api/orders/{id}
Get order details by ID (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "id": 1,
  "user_id": 1,
  "total_harga": 5000000,
  "status": "pending",
  "created_at": "2026-02-15T10:00:00Z",
  "details": [
    {
      "id": 1,
      "order_id": 1,
      "produk_item_id": 1,
      "qty": 2,
      "harga": 3499000
    }
  ],
  "amount": {
    "subtotal_minor": 699800000,
    "shipping_minor": 1500000,
    "discount_minor": 0,
    "tax_minor": 0,
    "total_minor": 701300000
  },
  "fulfillment": {
    "fulfillment_status": "unfulfilled",
    "tracking_number": null,
    "shipped_at": null,
    "delivered_at": null,
    "processing_at": null,
    "completed_at": null,
    "canceled_at": null,
    "cancel_reason": null
  },
  "financial": {
    "financial_status": "pending",
    "refunded_at": null,
    "refund_reason": null
  },
  "shipping": {
    "nama": "John Doe",
    "telepon": "081234567890",
    "alamat": "Jl. Contoh No. 123",
    "kota": "Jakarta",
    "kode_pos": "12345"
  }
}
```

**Penjelasan/Explanation - Type Alignments:**

| Frontend Type | API Response | Database |
|---------------|---------------|----------|
| `produk_id` | `produk_item_id` ✓ | `produk_item_id` |
| `quantity` | `qty` ✓ | `qty` |
| Flat amount fields | Nested `amount` object ✓ | Separate `order_amounts` table |
| `payment_status` | Nested `financial` object ✓ | Separate `order_financials` table |

**Amount Object Details:**
- `subtotal_minor`: Subtotal dalam sen (minor units) - contoh: 699800000 = Rp 6.998.000
- `shipping_minor`: Biaya pengiriman dalam sen
- `discount_minor`: Diskon dalam sen
- `tax_minor`: Pajak dalam sen
- `total_minor`: Total dalam sen

**Fulfillment Status Values:**
- `unfulfilled` - Belum diproses
- `processing` - Sedang diproses
- `shipped` - Sudah dikirim
- `completed` - Selesai
- `cancelled` - Dibatalkan
- `returned` - Dikembalikan

**Financial Status Values:**
- `pending` - Menunggu pembayaran
- `paid` - Sudah dibayar
- `failed` - Gagal
- `refunded` - Dikembalikan
- `partially_refunded` - Sebagian dikembalikan

---

### GET /api/cart
Get current user's cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "id": 1,
  "user_id": 1,
  "total_harga": 5000000,
  "status": "pending",
  "items": [
    {
      "id": 1,
      "produk_item_id": 1,
      "qty": 2,
      "harga": 3499000,
      "produk": {
        "id": 1,
        "nama": "Apple AirPods Pro",
        "gambar": "produk/airpods-pro.jpg"
      }
    }
  ]
}
```

**Penjelasan/Explanation:**
- `items`: Array item dalam keranjang
- `produk_item_id`: ID produk di keranjang (sudah sesuai dengan frontend)
- `qty`: Kuantitas (sudah sesuai dengan frontend types)

---

### POST /api/cart/items
Add item to cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "produk_item_id": 1,
  "quantity": 2
}
```

**Response (200 OK):**
```
json
{
  "message": "Item added to cart",
  "cart": {
    "id": 1,
    "total_harga": 5000000
  }
}
```

---

### POST /api/checkout
Process checkout (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "items": [
    {
      "produk_item_id": 1,
      "quantity": 2
    }
  ],
  "shipping": {
    "nama_penerima": "John Doe",
    "alamat": "Jl. Contoh No. 123",
    "no_telp": "081234567890",
    "metode": "jne"
  }
}
```

**Response (200 OK):**
```
json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "total_harga": 5000000,
    "status": "pending"
  }
}
```

---

## Wishlist Endpoints

### GET /api/wishlist
Get user's wishlist (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "produk_item_id": 1,
      "created_at": "2026-02-15T10:00:00Z",
      "produk": {
        "id": 1,
        "nama": "Apple AirPods Pro",
        "harga": 3499000,
        "gambar": "produk/airpods-pro.jpg"
      }
    }
  ]
}
```

**Penjelasan/Explanation - Type Alignments:**
| Frontend Type | API Response | Database |
|---------------|---------------|----------|
| `produk_id` | `produk_item_id` ✓ | `produk_item_id` |
| Tidak ada `created_at` | Ada `created_at` ✓ | Ada `created_at` |

---

### POST /api/wishlist
Add item to wishlist (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "produk_item_id": 1
}
```

**Response (200 OK):**
```
json
{
  "message": "Added to wishlist"
}
```

**Response (400 Bad Request) - Already exists:**
```
json
{
  "message": "Item already in wishlist"
}
```

---

### DELETE /api/wishlist/{produkItemId}
Remove item from wishlist (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Removed from wishlist"
}
```

---

## Review Endpoints

### POST /api/produk/{id}/reviews
Add review to product (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "rating": 5,
  "comment": "Produk ini luar biasa!"
}
```

**Response (201 Created):**
```
json
{
  "message": "Review added successfully",
  "review": {
    "id": 1,
    "user_id": 1,
    "produk_item_id": 1,
    "rating": 5,
    "comment": "Produk ini luar biasa!",
    "created_at": "2026-02-15T10:00:00Z"
  }
}
```

---

## Payment Endpoints

### POST /api/payment/{orderId}
Create payment for order (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Payment created",
  "payment": {
    "id": 1,
    "order_id": 1,
    "metode": "credit_card",
    "status": "pending",
    "payment_url": "https://midtrans.com/..."
  }
}
```

---

## Admin Endpoints

### POST /api/admin/produk
Create new product (requires admin authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "nama": "New Product",
  "deskripsi": "Product description",
  "harga": 1000000,
  "stok": 50,
  "category_id": 1
}
```

**Response (201 Created):**
```
json
{
  "id": 10,
  "nama": "New Product",
  "deskripsi": "Product description",
  "harga": 1000000,
  "stok": 50,
  "category_id": 1
}
```

---

## Response Type Explanations

### Type Alignment Summary

#### Category
| Frontend Type (Before) | Frontend Type (After) | API Response | Database |
|-----------------------|----------------------|--------------|----------|
| `nama_kategori` | `nama` ✓ | `nama` | `nama` |

#### Order Detail
| Frontend Type (Before) | Frontend Type (After) | API Response | Database |
|-----------------------|----------------------|--------------|----------|
| `produk_id` | `produk_item_id` ✓ | `produk_item_id` | `produk_item_id` |
| `quantity` | `qty` ✓ | `qty` | `qty` |

#### Order
| Frontend Type (Before) | Frontend Type (After) | API Response | Database |
|-----------------------|----------------------|--------------|----------|
| Flat `subtotal`, `shipping_cost`, `discount`, `total` | Nested `amount` object ✓ | Nested `amount` object | Separate `order_amounts` table |
| Flat `payment_status` | Nested `financial` object ✓ | Nested `financial` object | Separate `order_financials` table |

#### Wishlist
| Frontend Type | API Response | Database |
|---------------|--------------|----------|
| `produk_item_id` ✓ | `produk_item_id` | `produk_item_id` |
| `created_at` ✓ | `created_at` | `created_at` |

#### Produk
| Frontend Type | API Response | Database |
|---------------|--------------|----------|
| `nama` ✓ | `nama` | `nama` |
| `category_id` ✓ | `category_id` | `category_id` |
| `rating` ✓ | `rating` | - |
| `jumlah_review` ✓ | `jumlah_review` | - |

---

## Error Responses

### 400 Bad Request
```
json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

### 401 Unauthorized
```
json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```
json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```
json
{
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```
json
{
  "message": "The given data was invalid.",
  "errors": {
    "produk_item_id": ["The selected produk item id is invalid."]
  }
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

## Testing with cURL

```
bash
# Get Categories (public)
curl -X GET http://localhost:8000/api/categories

# Get Products (public)
curl -X GET http://localhost:8000/api/produk

# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get Profile (protected)
curl -X GET http://localhost:8000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get Orders (protected)
curl -X GET http://localhost:8000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes

1. **Minor Units**: Amount values in the `amount` object are in minor units (cents). For example, 699800000 = Rp 6,998,000
2. **Optional Fields**: Some fields are optional and may be null depending on the state of the resource
3. **Timestamps**: All timestamps are in ISO 8601 format (e.g., "2026-02-15T10:00:00Z")
4. **Image Paths**: Image paths are relative to the storage directory (e.g., "produk/image.jpg")

API Test Results Documentation Complete
I have documented all API test results to API_TEST_RESULTS.md file.

Summary:
✅ Tested Endpoints (11):

GET /api/categories - Working
GET /api/produk - Working
GET /api/produk/{id} - Working
POST /api/register - Working
POST /api/login - Working
GET /api/profile - Working (with auth)
PUT /api/profile - Working (with auth)
GET /api/orders - Working (with auth)
GET /api/cart - Working (with auth)
GET /api/wishlist - Working (with auth)
GET /api/produk/{id}/reviews - Working
❌ Endpoints with Issues (1):

POST /api/cart/items - Connection error (needs debugging)
⏳ Not Yet Tested (24+):

OAuth endpoints (google, facebook, apple login)
Forgot/reset password
POST /api/checkout
POST /api/buy-now
POST /api/wishlist
DELETE /api/wishlist/{id}
PATCH/DELETE cart endpoints
Payment endpoints
Admin endpoints
POST /api/logout
And more...
Documentation File Created:
API_TEST_RESULTS.md - Contains complete JSON responses for all tested endpoints, test credentials, and detailed status of each endpoint
Database Status:
Categories: 4 records
Products: 9 records
Users: 1 test user
Orders/Cart/Wishlist: Empty (as expected for new user)