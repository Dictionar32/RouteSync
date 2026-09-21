# API Documentation Lengkap

Base URL: `http://localhost:8000/api`

---

## 1. Produk API

### List Produk

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/produk` |
| **Method** | GET |
| **Auth** | Tidak wajib |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | Optional | Cari nama/deskripsi produk |
| category_id | integer | Optional | Filter berdasarkan kategori ID |
| kategori | string | Optional | Filter berdasarkan nama kategori |
| sort | string | Optional | latest (default), price_asc, price_desc, rating |

**Response:**
```
json
{
  "data": [
    {
      "id": 1,
      "name": "JBL Flip 5",
      "description": "Speaker bluetooth portable",
      "image": "produk/jbl_flip5.png",
      "image_url": "http://localhost:8000/storage/produk/jbl_flip5.png",
      "category_id": 1,
      "category_name": "Audio",
      "price": 15999000,
      "stock": 9,
      "rating": 4.7,
      "review_count": 66
    }
  ]
}
```

---

### Detail Produk

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/produk/{id}` |
| **Method** | GET |
| **Auth** | Tidak wajib |

**Response:**
```
json
{
  "data": {
    "id": 1,
    "name": "JBL Flip 5",
    "description": "Speaker bluetooth portable",
    "image": "produk/jbl_flip5.png",
    "image_url": "http://localhost:8000/storage/produk/jbl_flip5.png",
    "category_id": 1,
    "category_name": "Audio",
    "price": 15999000,
    "stock": 9,
    "rating": 4.7,
    "review_count": 66
  }
}
```

---

### Tambah Produk (Admin)

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/admin/produk` |
| **Method** | POST |
| **Auth** | Wajib (Admin) |

**Request Body:**
```
json
{
  "nama": "JBL Flip 5",
  "deskripsi": "Speaker bluetooth portable",
  "gambar": "file gambar",
  "category_id": 1,
  "harga": 15999000,
  "stok": 9
}
```

**Response:**
```
json
{
  "data": {
    "id": 1,
    "name": "JBL Flip 5",
    "description": "Speaker bluetooth portable",
    "image": "produk/jbl_flip5.png",
    "image_url": "http://localhost:8000/storage/produk/jbl_flip5.png",
    "category_id": 1,
    "category_name": "Audio",
    "price": 15999000,
    "stock": 9,
    "rating": 0,
    "review_count": 0
  }
}
```

---

### List Reviews Produk

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/produk/{id}/reviews` |
| **Method** | GET |
| **Auth** | Tidak wajib |

**Response:**
```
json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "user_name": "John Doe",
      "rating": 5,
      "comment": "Produk sangat bagus!",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Tambah Review Produk

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/produk/{id}/reviews` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "rating": 5,
  "comment": "Produk sangat bagus!"
}
```

**Response:**
```
json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "rating": 5,
    "comment": "Produk sangat bagus!",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

## 2. Categories API

### List Categories

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/categories` |
| **Method** | GET |
| **Auth** | Tidak wajib |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | integer | Optional | Halaman |
| per_page | integer | Optional | Jumlah per halaman |
| search | string | Optional | Cari kategori |

**Response:**
```
json
{
  "data": [
    {
      "id": 1,
      "nama": "Elektronik"
    },
    {
      "id": 2,
      "nama": "Fashion"
    }
  ]
}
```

---

## 3. Cart API

### Tambah ke Cart

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart/items` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "product_item_id": 1,
  "qty": 2
}
```

**Response:**
```
json
{
  "data": {
    "id": 1,
    "status": "cart",
    "total_harga": 31998000,
    "items": [...]
  }
}
```

---

### Update Cart Item

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart/items/{produkItemId}` |
| **Method** | PATCH |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "qty": 3
}
```

---

### Hapus Cart Item

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart/items/{produkItemId}` |
| **Method** | DELETE |
| **Auth** | Wajib |

**Response:**
```
json
{
  "message": "Item dihapus dari cart"
}
```

---

### Clear Cart

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart` |
| **Method** | DELETE |
| **Auth** | Wajib |

**Response:**
```
json
{
  "message": "Cart dikosongkan"
}
```

---

### Get Cart

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/keranjang` |
| **Method** | GET |
| **Auth** | Wajib |

**Response:**
```
json
{
  "data": {
    "id": 1,
    "status": "cart",
    "total_harga": 31998000,
    "items": [
      {
        "produk_item_id": 1,
        "product_id": 1,
        "product_name": "JBL Flip 5",
        "product_image": "produk/jbl.png",
        "product_image_url": "http://localhost:8000/storage/produk/jbl.png",
        "qty": 2,
        "price": 15999000,
        "subtotal": 31998000
      }
    ],
    "promotion": null,
    "shipping": {
      "nama": null,
      "telepon": null,
      "alamat": null,
      "kota": null,
      "kode_pos": null
    }
  }
}
```

---

## 4. Promo API

### Apply Promo

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart/promo` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "code": "DISCOUNT10"
}
```

**Response:**
```
json
{
  "message": "Promo code applied successfully",
  "discount": 10000
}
```

---

### Remove Promo

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/cart/promo` |
| **Method** | DELETE |
| **Auth** | Wajib |

---

## 5. Orders API

### List Orders

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/orders` |
| **Method** | GET |
| **Auth** | Wajib |

**Query Params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | integer | Optional | Halaman |
| per_page | integer | Optional | Jumlah per halaman |
| status | string | Optional | Filter status |

**Response:**
```
json
{
  "data": [
    {
      "id": 1,
      "status": "pending",
      "total_harga": 300000,
      "invoice_number": "INV-2024-001",
      "payment_status": "pending",
      "financial_status": "pending",
      "fulfillment_status": "pending",
      "subtotal_minor": 300000,
      "discount_minor": 0,
      "shipping_minor": 15000,
      "tax_minor": 30000,
      "total_harga_minor": 345000,
      "items": [...],
      "promotion": null,
      "shipping": {
        "nama": "John Doe",
        "telepon": "081234567890",
        "alamat": "Jl. ABC No. 123",
        "kota": "Jakarta",
        "kode_pos": "12345"
      },
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### Detail Order

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/orders/{id}` |
| **Method** | GET |
| **Auth** | Wajib |

**Response:**
```
json
{
  "data": {
    "id": 1,
    "status": "pending",
    "total_harga": 300000,
    "invoice_number": "INV-2024-001",
    "payment_status": "pending",
    "financial_status": "pending",
    "fulfillment_status": "pending",
    "subtotal_minor": 300000,
    "discount_minor": 0,
    "shipping_minor": 15000,
    "tax_minor": 30000,
    "total_harga_minor": 345000,
    "items": [
      {
        "id": 1,
        "produk_item_id": 1,
        "produk": {
          "id": 1,
          "nama": "JBL Flip 5",
          "gambar": "produk/jbl.png",
          "image_url": "http://localhost:8000/storage/produk/jbl.png"
        },
        "qty": 2,
        "harga": 150000,
        "subtotal": 300000
      }
    ],
    "promotion": {
      "code": "DISCOUNT10",
      "discount_minor": 10000
    },
    "shipping": {
      "nama": "John Doe",
      "telepon": "081234567890",
      "alamat": "Jl. ABC No. 123",
      "kota": "Jakarta",
      "kode_pos": "12345"
    },
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### Checkout

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/checkout` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "shipping_nama": "John Doe",
  "shipping_telepon": "081234567890",
  "shipping_alamat": "Jl. ABC No. 123",
  "shipping_kota": "Jakarta",
  "shipping_kode_pos": "12345"
}
```

**Response:**
```
json
{
  "data": {
    "id": 1,
    "status": "pending",
    "total_harga": 300000,
    "invoice_number": "INV-2024-001",
    ...
  }
}
```

---

### Buy Now

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/buy-now` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "produk_item_id": 1,
  "qty": 1,
  "shipping_nama": "John Doe",
  "shipping_telepon": "081234567890",
  "shipping_alamat": "Jl. ABC No. 123",
  "shipping_kota": "Jakarta",
  "shipping_kode_pos": "12345"
}
```

---

## 6. Wishlist API

### List Wishlist

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/wishlist` |
| **Method** | GET |
| **Auth** | Wajib |

**Response:**
```
json
{
  "data": [
    {
      "id": 1,
      "name": "JBL Flip 5",
      "description": "Speaker bluetooth portable",
      "image": "produk/jbl.png",
      "image_url": "http://localhost:8000/storage/produk/jbl.png",
      "category_id": 1,
      "category_name": "Audio",
      "price": 15999000,
      "stock": 9,
      "rating": 4.7,
      "review_count": 66
    }
  ]
}
```

---

### Add to Wishlist

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/wishlist` |
| **Method** | POST |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "produk_item_id": 1
}
```

**Response:**
```
json
{
  "message": "Item ditambahkan ke wishlist"
}
```

---

### Remove from Wishlist

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/wishlist/{produkItemId}` |
| **Method** | DELETE |
| **Auth** | Wajib |

**Response:**
```
json
{
  "message": "Item dihapus dari wishlist"
}
```

---

## 7. Payment API

### Create Payment

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/payment/{orderId}` |
| **Method** | POST |
| **Auth** | Wajib |

**Response:**
```
json
{
  "data": {
    "id": 1,
    "order_id": 1,
    "invoice_number": "INV-2024-001",
    "metode": "midtrans",
    "status": "pending",
    "paid_at": null,
    "amount_minor": 345000,
    "refund_amount_minor": 0,
    "total_harga": 345000,
    "gateway": {
      "name": "midtrans",
      "order_id": "ORDER-1",
      "token": "token123",
      "redirect_url": "https://midtrans.com/pay/..."
    }
  }
}
```

### Payment Webhook

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/payment/webhook` |
| **Method** | POST |
| **Auth** | Tidak wajib |

---

## 8. Profile API

### Get Profile

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/profile` |
| **Method** | GET |
| **Auth** | Wajib |

**Response:**
```json
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Update Profile

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/profile` |
| **Method** | PUT/PATCH |
| **Auth** | Wajib |

**Request Body:**
```
json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```
json
{
  "message": "Profile updated successfully"
}
```

---

## 9. Auth API

### Register

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/register` |
| **Method** | POST |
| **Auth** | Tidak wajib |

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

**Response:**
```
json
{
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

### Login

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/login` |
| **Method** | POST |
| **Auth** | Tidak wajib |

**Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```
json
{
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

### Logout

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/logout` |
| **Method** | POST |
| **Auth** | Wajib |

**Response:**
```
json
{
  "message": "Logged out successfully"
}
```

---

### Social Login

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/social/login` |
| **Method** | POST |
| **Auth** | Tidak wajib |

**Request Body:**
```
json
{
  "provider": "google",
  "access_token": "token dari social provider"
}
```

---

### Forgot Password

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/forgot-password` |
| **Method** | POST |
| **Auth** | Tidak wajib |

**Request Body:**
```
json
{
  "email": "john@example.com"
}
```

---

### Reset Password

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/reset-password` |
| **Method** | POST |
| **Auth** | Tidak wajib |

**Request Body:**
```
json
{
  "email": "john@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

---

## 10. Invoice API

### Download Invoice

| Field | Value |
|-------|-------|
| **Endpoint** | `/api/orders/{id}/invoice` |
| **Method** | GET |
| **Auth** | Wajib |

**Response:** PDF file (download)

---

## Notes

- **Auth**: Wajib = requires Bearer token
- **Currency**: Prices in IDR (Rupiah)
- **Status Values**: pending, success, failed, expired, settlement, refund
