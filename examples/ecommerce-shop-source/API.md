# API Documentation

This document provides a comprehensive overview of all API endpoints in the LKS E-Commerce project.

## Base URL
```
http://localhost:8000/api
```

## Authentication
- Most endpoints require authentication using Laravel Sanctum tokens
- Include the token in the request header: `Authorization: Bearer <token>`

## Content Type
All requests and responses use JSON format:
```
Content-Type: application/json
```

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Public Endpoints](#public-endpoints)
3. [Protected Endpoints](#protected-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Response Formats](#response-formats)

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
  "token": "1|abc123..."
}
```

---

### POST /api/login
Login with email and password.

**Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
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
  "token": "1|abc123..."
}
```

**Response (401 Unauthorized):**
```
json
{
  "message": "Invalid credentials"
}
```

---

### GET /api/oauth/{provider}/redirect
Redirect to OAuth provider for authentication.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | OAuth provider (google, facebook, apple) |

**Response (302 Found):**
Redirects to OAuth provider's authorization page.

---

### GET/POST /api/oauth/{provider}/callback
OAuth callback handler.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | OAuth provider (google, facebook, apple) |

**Response (200 OK):**
```
json
{
  "message": "OAuth login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123..."
}
```

---

### POST /api/social/login
Login or register using social media account.

**Request Body:**
```
json
{
  "provider": "google",
  "access_token": "google-oauth-access-token"
}
```

**Response (200 OK):**
```
json
{
  "message": "Social login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "1|abc123..."
}
```

**Response (401 Unauthorized):**
```
json
{
  "message": "Invalid social token"
}
```

---

### POST /api/logout
Logout the current user (requires authentication).

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

### POST /api/forgot-password
Request password reset link.

**Request Body:**
```
json
{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```
json
{
  "message": "Password reset link sent to your email"
}
```

---

### POST /api/reset-password
Reset password using token.

**Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123",
  "token": "reset-token-from-email"
}
```

**Response (200 OK):**
```
json
{
  "message": "Password has been reset successfully"
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
    }
  ]
}
```

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
      "deskripsi": "Earbuds premium...",
      "harga": 3499000,
      "stok": 20,
      "category_id": 1,
      "gambar": "produk/image.jpg",
      "rating": 4.8,
      "jumlah_review": 125
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 9
  }
}
```

---

### GET /api/produk/{id}
Get product details by ID.

**Response (200 OK):**
```
json
{
  "id": 1,
  "nama": "Apple AirPods Pro",
  "deskripsi": "Earbuds premium dengan active noise cancellation.",
  "harga": 3499000,
  "stok": 20,
  "category_id": 1,
  "gambar": "produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg",
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
    }
  ]
}
```

---

### POST /api/payment/webhook
Payment gateway webhook endpoint.

**Request Body:** (varies by provider)
```
json
{
  "order_id": "123",
  "status": "success",
  "transaction_id": "txn_123"
}
```

**Response (200 OK):**
```
json
{
  "message": "Webhook processed"
}
```

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

### PATCH /api/profile
Update user profile (alternative method).

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
```
json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "total_harga": 5000000,
      "status": "pending",
      "created_at": "2026-02-15T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 5
  }
}
```

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
    "fulfillment_status": "unfulfilled"
  },
  "financial": {
    "financial_status": "pending"
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

---

### GET /api/cart (or /api/keranjang)
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
        "gambar": "produk/image.jpg"
      }
    }
  ]
}
```

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

### PATCH /api/cart/items/{produkItemId}
Update cart item quantity (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "quantity": 3
}
```

**Response (200 OK):**
```
json
{
  "message": "Cart item updated"
}
```

---

### DELETE /api/cart/items/{produkItemId}
Remove item from cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Item removed from cart"
}
```

---

### DELETE /api/cart
Clear all items from cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Cart cleared"
}
```

---

### POST /api/cart/promo
Apply promo code to cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "code": "HEMAT50K"
}
```

**Response (200 OK):**
```
json
{
  "message": "Promo code applied",
  "discount": 50000
}
```

**Response (400 Bad Request):**
```
json
{
  "message": "Invalid or expired promo code"
}
```

---

### DELETE /api/cart/promo
Remove promo code from cart (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```
json
{
  "message": "Promo code removed"
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

### POST /api/buy-now
Buy single item immediately (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```
json
{
  "produk_item_id": 1,
  "quantity": 1,
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
    "total_harga": 3499000,
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
      "produk": {
        "id": 1,
        "nama": "Apple AirPods Pro",
        "harga": 3499000,
        "gambar": "produk/image.jpg"
      }
    }
  ]
}
```

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

**Response (400 Bad Request):**
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
```json
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

### GET /api/orders/{id}/invoice
Download invoice PDF (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** PDF file download

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

## Response Formats

### Success Response
```
json
{
  "data": { ... },
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 15,
    "total": 10
  }
}
```

### Error Response (400)
```
json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### Error Response (401)
```
json
{
  "message": "Unauthenticated"
}
```

### Error Response (403)
```
json
{
  "message": "Unauthorized"
}
```

### Error Response (404)
```
json
{
  "message": "Resource not found"
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

## Testing the API

### Using cURL

```
bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get Categories (public)
curl http://localhost:8000/api/categories

# Get Products (public)
curl http://localhost:8000/api/produk

# Get Profile (protected)
curl -X GET http://localhost:8000/api/profile \
  -H "Authorization: Bearer <token>"
```

### Using Postman
1. Create a new collection
2. Add requests for each endpoint
3. Set Content-Type header to application/json
4. For protected endpoints, add Authorization header with Bearer token
5. Import the frontend API contracts from `frontend/src/features/*/contracts/` for schema validation
