# API Documentation

## Authentication

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/register | POST | No | name, email, password, password_confirmation | User + token |
| /api/login | POST | No | email, password | User + token |
| /api/logout | POST | Yes | - | Message |
| /api/oauth/{provider}/redirect | GET | No | - | Redirect URL |
| /api/oauth/{provider}/callback | GET/POST | No | - | User + token |
| /api/social/login | POST | No | provider, access_token | User + token |
| /api/forgot-password | POST | No | email | Message |
| /api/reset-password | POST | No | email, password, password_confirmation | Message |

## Products (Produk)

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/produk | GET | No | search, category_id, kategori, sort | List produk JSON |
| /api/produk/{id} | GET | No | - | Detail produk JSON |
| /api/produk/{id}/reviews | GET | No | - | List review JSON |
| /api/produk/{id}/reviews | POST | Yes | rating, comment | Review created JSON |
| /api/admin/produk | POST | Yes (Admin) | nama, deskripsi, gambar, category_id, harga, stok | Produk created JSON |

## Categories

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/categories | GET | No | page, per_page, search | List kategori JSON |

## Cart

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/cart/items | POST | Yes | product_item_id, qty | Item ditambahkan JSON |
| /api/cart/items/{produkItemId} | PATCH | Yes | qty | Item diperbarui JSON |
| /api/cart/items/{produkItemId} | DELETE | Yes | - | Item dihapus JSON |
| /api/cart | DELETE | Yes | - | Cart dikosongkan JSON |
| /api/cart/promo | POST | Yes | code | Promo diterapkan JSON |
| /api/cart/promo | DELETE | Yes | - | Promo dihapus JSON |
| /api/keranjang | GET | Yes | - | List cart JSON |

## Orders

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/orders | GET | Yes | page, per_page, status | List order JSON |
| /api/orders/{id} | GET | Yes | - | Detail order JSON |
| /api/checkout | POST | Yes | shipping_nama, shipping_telepon, shipping_alamat, shipping_kota, shipping_kode_pos | Order created JSON |
| /api/buy-now | POST | Yes | produk_item_id, qty, shipping_* | Order created JSON |
| /api/orders/{id}/invoice | GET | Yes | - | PDF (download) |

## Wishlist

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/wishlist | GET | Yes | - | List wishlist JSON |
| /api/wishlist | POST | Yes | produk_item_id | Item ditambahkan JSON |
| /api/wishlist/{produkItemId} | DELETE | Yes | - | Item dihapus JSON |

## Payments

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/payment/{orderId} | POST | Yes | - | Payment data JSON |
| /api/payment/webhook | POST | No | - | Webhook diproses |

## Profile

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/profile | GET | Yes | - | Profile data JSON |
| /api/profile | PUT | Yes | name, email | Profile diperbarui JSON |
| /api/profile | PATCH | Yes | name, email | Profile diperbarui JSON |

## Promo

| Endpoint | Method | Auth | Params | Response |
|----------|--------|------|--------|----------|
| /api/cart/promo | POST | Yes | code | Promo diterapkan JSON |
| /api/cart/promo | DELETE | Yes | - | Promo dihapus JSON |

---

**Base URL:** `http://localhost:8000/api`

**Notes:**
- Auth: Yes = requires Bearer token, No = public
- Admin routes require admin role
