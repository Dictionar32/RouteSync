# Frontend Rebuild Plan - LKS E-Commerce

## 1. Tech Stack Analysis

### Current Tech Stack (from frontend/package.json)
- **Next.js**: 16.1.6
- **React**: 19.2.3
- **Tailwind CSS**: 4 (with @tailwindcss/postcss)
- **TypeScript**: 5
- **Node.js**: Latest (implied by Next.js 16)

### Backend Stack (Laravel)
- **Framework**: Laravel (latest)
- **API**: RESTful API with Laravel Sanctum for authentication
- **Database**: MySQL (implied from migrations)

---

## 2. Backend API Verification

### ✅ Database & Products
- **Products Table**: Already seeded with 9 products
- **Images**: All product images are in `storage/app/public/produk/`
- **Categories**: Audio, Smartphone, Wearable, Laptop

### Product List (from ProdukItemSeeder):
| # | Product Name | Category | Price | Stock |
|---|--------------|----------|-------|-------|
| 1 | Apple AirPods Pro | Audio | Rp 3,499,000 | 20 |
| 2 | Samsung Galaxy S22 | Smartphone | Rp 11,999,000 | 15 |
| 3 | Apple Watch Series 7 | Wearable | Rp 7,999,000 | 12 |
| 4 | Sony WH-1000XM4 | Audio | Rp 4,999,000 | 18 |
| 5 | MacBook Air M1 | Laptop | Rp 15,999,000 | 8 |
| 6 | Xiaomi Mi Band 6 | Wearable | Rp 499,000 | 30 |
| 7 | Sony WH-1000XM4 BLACK | Audio | Rp 15,999,000 | 9 |
| 8 | JBL Flip 5 | Audio | Rp 1,699,000 | 25 |
| 9 | Earbuds Wireless Lite | Audio | Rp 1,299,000 | 35 |

### API Endpoints (from routes/api.php)

#### Public Endpoints
```
POST   /api/register           - Register new user
POST   /api/login              - User login
GET    /api/categories         - List all categories
GET    /api/produk             - List all products
GET    /api/produk/{id}        - Get product detail
GET    /api/produk/{id}/reviews - Get product reviews
POST   /api/payment/webhook    - Payment webhook (Midtrans)
GET    /api/oauth/{provider}/redirect     - OAuth redirect
POST   /api/oauth/{provider}/callback     - OAuth callback
POST   /api/social/login       - Social login
POST   /api/forgot-password    - Forgot password
POST   /api/reset-password     - Reset password
```

#### Protected Endpoints (auth:sanctum)
```
GET    /api/profile            - Get user profile
PUT    /api/profile            - Update user profile
PATCH  /api/profile            - Update user profile

GET    /api/orders             - List user orders
GET    /api/orders/{id}        - Get order detail

GET    /api/cart               - Get cart items
POST   /api/cart/items         - Add item to cart
PATCH  /api/cart/items/{id}    - Update cart item
DELETE /api/cart/items/{id}    - Remove cart item
DELETE /api/cart               - Clear cart
POST   /api/cart/promo         - Apply promo code
DELETE /api/cart/promo         - Remove promo code

POST   /api/checkout           - Create order from cart
POST   /api/buy-now           - Buy now (single product)

GET    /api/wishlist           - Get wishlist
POST   /api/wishlist          - Add to wishlist
DELETE /api/wishlist/{id}     - Remove from wishlist

POST   /api/produk/{id}/reviews - Add product review

POST   /api/payment/{orderId}  - Create payment
GET    /api/orders/{id}/invoice - Download invoice
POST   /api/logout            - User logout
```

#### Admin Endpoints (auth:sanctum + admin)
```
POST   /api/admin/produk       - Create new product
```

---

## 3. API Response Structures

### Product Response (ProdukItemResource)
```
json
{
  "id": 1,
  "nama": "Apple AirPods Pro",
  "deskripsi": "Earbuds premium dengan active noise cancellation.",
  "gambar": "produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg",
  "image_url": "http://localhost:8000/storage/produk/WhatsApp Image 2026-02-15 at 10.17.07.jpeg",
  "category_id": 1,
  "kategori": "Audio",
  "harga": 3499000,
  "stok": 20,
  "rating": 4.8,
  "jumlah_review": 125
}
```

### Order Response (OrderResource)
```
json
{
  "id": 1,
  "status": "pending",
  "total_harga": 3499000,
  "invoice_number": "ORD-2026-0001",
  "payment_status": "pending",
  "financial_status": "pending",
  "fulfillment_status": "pending",
  "subtotal_minor": 3499000,
  "discount_minor": 0,
  "shipping_minor": 0,
  "tax_minor": 0,
  "total_harga_minor": 3499000,
  "items": [...],
  "promotion": {
    "code": null,
    "discount_minor": 0
  },
  "shipping": {
    "nama": null,
    "telepon": null,
    "alamat": null,
    "kota": null,
    "kode_pos": null
  },
  "created_at": "2026-02-16T10:00:00"
}
```

---

## 4. Shadcn Components Required

Based on the backend API and pages needed, here are the shadcn/ui components required:

### Core Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Button** | All interactive actions | Login, register, add to cart, checkout, etc. |
| **Input** | Form fields | Search, login, register, checkout forms |
| **Label** | Form labels | All forms |
| **Form** | Form validation | Login, register, checkout, profile |
| **Card** | Content containers | Product cards, order cards |
| **Badge** | Status indicators | Order status, payment status, stock status |
| **Avatar** | User profile | Profile page, comments |
| **Separator** | Content dividers | Layout sections |

### Navigation Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Dropdown Menu** | User menu, categories | Navbar user menu, category dropdown |
| **Tabs** | Content switching | Product details, order details |
| **Navigation Menu** | Main navigation | Navbar |

### Data Display Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Table** | Data tables | Order history, cart items |
| **Skeleton** | Loading states | Product loading, orders loading |
| **Rating** (custom) | Product ratings | Product cards, reviews |

### Feedback Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Toast** | Notifications | Success, error, info messages |
| **Dialog** | Modals | Confirm delete, quick view |
| **Sheet** | Side panels | Cart sidebar |
| **Alert** | Warnings | Stock warnings, errors |

### Form Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Select** | Dropdowns | Category filter, payment method |
| **Checkbox** | Checkboxes | Terms acceptance, multiple selection |
| **Radio Group** | Radio buttons | Payment method selection |
| **Textarea** | Long text | Product review comment |

### Layout Components
| Component | Purpose | Usage |
|-----------|---------|-------|
| **Accordion** | Collapsible content | FAQ, product specifications |
| **Scroll Area** | Scrollable content | Product details, order history |

---

## 5. Pages Structure

### App Pages (Next.js App Router)
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── register/
│   │   └── page.tsx          # Register page
│   └── forgot-password/
│       └── page.tsx          # Forgot password page
├── (app)/
│   ├── page.tsx              # Home page (product listing)
│   ├── produk/
│   │   ├── page.tsx          # Product listing with filters
│   │   └── [id]/
│   │       └── page.tsx      # Product detail
│   ├── keranjang/
│   │   └── page.tsx          # Shopping cart
│   ├── checkout/
│   │   └── page.tsx          # Checkout page
│   ├── orders/
│   │   ├── page.tsx          # Order history
│   │   └── [id]/
│   │       └── page.tsx      # Order detail
│   ├── wishlist/
│   │   └── page.tsx          # Wishlist page
│   └── profile/
│       └── page.tsx          # Profile page
├── layout.tsx                # Root layout
└── globals.css               # Global styles
```

---

## 6. Components Directory Structure

```
src/
├── app/                      # Next.js pages
├── components/
│   ├── ui/                   # Shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── ...
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   ├── product/
│   │   ├── product-card.tsx
│   │   ├── product-grid.tsx
│   │   ├── product-filter.tsx
│   │   └── product-detail.tsx
│   ├── cart/
│   │   ├── cart-item.tsx
│   │   ├── cart-summary.tsx
│   │   └── cart-sheet.tsx
│   ├── order/
│   │   ├── order-card.tsx
│   │   ├── order-item.tsx
│   │   └── order-status.tsx
│   └── auth/
│       ├── login-form.tsx
│       └── register-form.tsx
├── lib/
│   ├── api.ts               # API client
│   ├── auth.ts              # Auth utilities
│   └── utils.ts             # Utility functions
├── hooks/
│   ├── use-cart.ts
│   ├── use-auth.ts
│   └── use-products.ts
└── types/
    ├── product.ts
    ├── order.ts
    └── user.ts
```

---

## 7. State Management

### Cart State (Zustand)
```
typescript
interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  applyPromo: (code: string) => void;
  removePromo: () => void;
  subtotal: number;
  discount: number;
  total: number;
}
```

### Auth State (Zustand)
```
typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
}
```

---

## 8. Installation Steps

### 1. Install Shadcn CLI
```
bash
npx shadcn@latest init
```

### 2. Install Required Components
```
bash
npx shadcn@latest add button input label form card badge avatar separator
npx shadcn@latest add dropdown-menu tabs navigation-menu
npx shadcn@latest add table skeleton
npx shadcn@latest add toast dialog sheet alert
npx shadcn@latest add select checkbox radio-group textarea
npx shadcn@latest add accordion scroll-area
```

### 3. Install Additional Dependencies
```
bash
npm install zustand axios react-hook-form @hookform/resolvers zod
npm install lucide-react
```

---

## 9. Summary

### Backend Status: ✅ Ready
- Products seeded with images
- API endpoints configured
- Authentication with Laravel Sanctum
- Payment integration with Midtrans

### Frontend Requirements:
- **15+ Shadcn components** needed
- **11 pages** to create
- **State management** with Zustand
- **API integration** with Axios

### Next Steps:
1. Initialize shadcn in frontend
2. Install required components
3. Create component structure
4. Implement API integration
5. Build pages one by one






features/
├─ auth/
│  ├─ services/authService.ts
│  ├─ hooks/useAuthHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/authMapper.ts
│
├─ produk/
│  ├─ services/produkService.ts
│  ├─ hooks/useProdukHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/produkMapper.ts
│
├─ kategori/
│  ├─ services/kategoriService.ts
│  ├─ hooks/useKategoriHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/kategoriMapper.ts
│
├─ wishlist/
│  ├─ services/wishlistService.ts
│  ├─ hooks/useWishlistHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/wishlistMapper.ts
│
├─ cart/
│  ├─ store/useCartStore.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/cartMapper.ts
│
├─ orders/
│  ├─ services/orderService.ts
│  ├─ hooks/useOrderHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/orderMapper.ts
│
├─ payment/
│  ├─ services/paymentService.ts
│  ├─ hooks/usePaymentHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/paymentMapper.ts
│
├─ promo/
│  ├─ services/promoService.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/promoMapper.ts
│
├─ review/
│  ├─ services/reviewService.ts
│  ├─ hooks/useReviewHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/reviewMapper.ts
│
├─ profile/
│  ├─ services/profileService.ts
│  ├─ hooks/useProfileHooks.ts
│  ├─ types/
│  │  ├─ read.ts
│  │  └─ form.ts
│  ├─ contracts/
│  │  ├─ api-contract.ts
│  │  ├─ api-field.ts
│  │  └─ api-schema.ts
│  └─ mappers/profileMapper.ts
