# Backend Structure Documentation

## Overview

This document describes the backend structure of the LKS E-Commerce application, built with Laravel 12+, PHP 8.2+, and modern Laravel patterns.

---

## Tech Stack

### Core
- **PHP**: ^8.2
- **Laravel**: ^12.0
- **Laravel Sanctum**: ^4.0 (API Authentication)
- **Laravel Socialite**: ^5.24 (OAuth)
- **barryvdh/laravel-dompdf**: ^3.1 (PDF Generation)

### OAuth Providers
- **Socialite Providers**: Apple, Google, Facebook, GitHub

---

## Current Directory Structure

```
app/
├── Console/
├── Exceptions/
├── Http/
│   ├── Controllers/
│   ├── Middleware/
│   └── Requests/
├── Models/
├── Providers/
├── Services/
│   └── PaymentGateways/
│       └── MidtransGateway.php
├── Models/
└── ...
```

---

## Proposed Feature-Based Architecture

### Recommended Directory Structure

```
app/
├── Features/
│   ├── Auth/
│   │   ├── Contracts/
│   │   │   └── AuthContract.php
│   │   ├── Services/
│   │   │   ├── AuthService.php
│   │   │   └── SocialAuthService.php
│   │   ├── Requests/
│   │   │   ├── LoginRequest.php
│   │   │   ├── RegisterRequest.php
│   │   │   └── ForgotPasswordRequest.php
│   │   └── Types/
│   │       └── AuthTypes.php
│   │
│   ├── Produk/
│   │   ├── Contracts/
│   │   │   └── ProdukContract.php
│   │   ├── Services/
│   │   │   ├── ProdukService.php
│   │   │   └── ProdukAdminService.php
│   │   ├── Requests/
│   │   │   ├── StoreProdukRequest.php
│   │   │   └── UpdateProdukRequest.php
│   │   ├── Resources/
│   │   │   └── ProdukResource.php
│   │   ├── Mappers/
│   │   │   └── ProdukMapper.php
│   │   └── Types/
│   │       └── ProdukTypes.php
│   │
│   ├── Cart/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   └── CartService.php
│   │   ├── Requests/
│   │   │   ├── AddToCartRequest.php
│   │   │   └── UpdateCartRequest.php
│   │   └── Types/
│   │       └── CartTypes.php
│   │
│   ├── Order/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   ├── OrderService.php
│   │   │   ├── CheckoutService.php
│   │   │   └── OrderAdminService.php
│   │   ├── Requests/
│   │   │   ├── StoreOrderRequest.php
│   │   │   └── UpdateOrderRequest.php
│   │   ├── Resources/
│   │   │   ├── OrderResource.php
│   │   │   └── OrderDetailResource.php
│   │   ├── Mappers/
│   │   │   └── OrderMapper.php
│   │   └── Types/
│   │       └── OrderTypes.php
│   │
│   ├── Payment/
│   │   ├── Contracts/
│   │   │   └── PaymentContract.php
│   │   ├── Services/
│   │   │   ├── PaymentService.php
│   │   │   └── MidtransService.php
│   │   ├── Requests/
│   │   │   └── StorePaymentRequest.php
│   │   ├── Resources/
│   │   │   └── PaymentResource.php
│   │   └── Types/
│   │       └── PaymentTypes.php
│   │
│   ├── Wishlist/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   └── WishlistService.php
│   │   └── Types/
│   │       └── WishlistTypes.php
│   │
│   ├── Category/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   └── CategoryService.php
│   │   └── Types/
│   │       └── CategoryTypes.php
│   │
│   ├── Review/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   └── ReviewService.php
│   │   └── Types/
│   │       └── ReviewTypes.php
│   │
│   ├── Promo/
│   │   ├── Contracts/
│   │   ├── Services/
│   │   │   └── PromoService.php
│   │   └── Types/
│   │       └── PromoTypes.php
│   │
│   └── Profile/
│       ├── Contracts/
│       ├── Services/
│       │   └── ProfileService.php
│       └── Types/
│           └── ProfileTypes.php
│
├── Models/              # Eloquent Models (keep existing)
├── Http/
│   ├── Controllers/    # API Controllers (thin, delegate to Services)
│   ├── Middleware/    # Custom Middleware
│   └── Requests/      # Form Requests (validation)
├── Providers/          # Service Providers
├── Services/           # Shared Services (Payment Gateways)
├── Contracts/         # Interface definitions
└── ...
```

---

## 1. Features Directory (`app/Features/`)

### Feature Structure Pattern

Each feature follows a consistent pattern:

```
features/[feature-name]/
├── Contracts/         # Interface/Contract definitions
├── Services/          # Business logic layer
├── Requests/         # Form request validation
├── Resources/        # API Resource transformers
├── Mappers/          # Data transformation
├── Types/            # TypeScript-like type definitions (PHP)
└── Exceptions/       # Feature-specific exceptions
```

### 1.1 Auth Feature

```
features/Auth/
├── Contracts/
│   └── AuthContract.php       # Interface for Auth operations
├── Services/
│   ├── AuthService.php        # Login, register, logout logic
│   └── SocialAuthService.php  # OAuth logic
├── Requests/
│   ├── LoginRequest.php       # Login validation
│   ├── RegisterRequest.php    # Register validation
│   └── ForgotPasswordRequest.php
├── Types/
│   └── AuthTypes.php          # DTOs and types
└── Exceptions/
    └── AuthException.php      # Auth-specific exceptions
```

### 1.2 Produk Feature

```
features/Produk/
├── Contracts/
│   └── ProdukContract.php     # Interface for Produk operations
├── Services/
│   ├── ProdukService.php      # CRUD operations
│   └── ProdukAdminService.php # Admin-specific operations
├── Requests/
│   ├── StoreProdukRequest.php
│   └── UpdateProdukRequest.php
├── Resources/
│   └── ProdukResource.php     # API response transformer
├── Mappers/
│   └── ProdukMapper.php       # Data transformation
└── Types/
    └── ProdukTypes.php        # DTOs: ProdukCreate, ProdukUpdate, etc.
```

### 1.3 Cart Feature

```
features/Cart/
├── Contracts/
│   └── CartContract.php
├── Services/
│   └── CartService.php        # Cart operations
├── Requests/
│   ├── AddToCartRequest.php
│   └── UpdateCartRequest.php
└── Types/
    └── CartTypes.php          # CartItem, CartTotal, etc.
```

### 1.4 Order Feature

```
features/Order/
├── Contracts/
│   └── OrderContract.php
├── Services/
│   ├── OrderService.php      # Order CRUD
│   ├── CheckoutService.php   # Checkout logic
│   └── OrderAdminService.php # Admin order management
├── Requests/
│   ├── StoreOrderRequest.php
│   └── UpdateOrderRequest.php
├── Resources/
│   ├── OrderResource.php
│   └── OrderDetailResource.php
├── Mappers/
│   └── OrderMapper.php
└── Types/
    └── OrderTypes.php        # OrderCreate, OrderUpdate, etc.
```

### 1.5 Payment Feature

```
features/Payment/
├── Contracts/
│   └── PaymentContract.php
├── Services/
│   ├── PaymentService.php   # Payment logic
│   └── MidtransService.php # Midtrans integration
├── Requests/
│   └── StorePaymentRequest.php
├── Resources/
│   └── PaymentResource.php
└── Types/
    └── PaymentTypes.php     # PaymentCreate, PaymentStatus, etc.
```

---

## 2. Contracts (`app/Contracts/`)

### Purpose
Define interfaces for dependency injection and testing.

```
contracts/
├── Auth/
│   └── AuthContract.php
├── Produk/
│   └── ProdukContract.php
├── Cart/
│   └── CartContract.php
├── Order/
│   └── OrderContract.php
├── Payment/
│   └── PaymentContract.php
└── Wishlist/
    └── WishlistContract.php
```

### Example: AuthContract.php

```
php
<?php

namespace App\Contracts\Auth;

interface AuthContract
{
    public function login(array $credentials): array;
    public function register(array $data): array;
    public function logout(int $userId): void;
    public function refreshToken(string $token): string;
    public function validateToken(string $token): bool;
}
```

---

## 3. Services (`app/Features/[Feature]/Services/`)

### Purpose
Contain business logic, separate from Controllers.

### Example: AuthService.php

```
php
<?php

namespace App\Features\Auth\Services;

use App\Contracts\Auth\AuthContract;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService implements AuthContract
{
    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();
        
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new \Exception('Invalid credentials');
        }
        
        $token = $user->createToken('auth-token')->plainTextToken;
        
        return [
            'user' => $user,
            'token' => $token,
        ];
    }
    
    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
        
        $token = $user->createToken('auth-token')->plainTextToken;
        
        return [
            'user' => $user,
            'token' => $token,
        ];
    }
    
    // ... other methods
}
```

---

## 4. Request Validation (`app/Features/[Feature]/Requests/`)

### Purpose
Form request validation, similar to frontend Zod schemas.

### Example: StoreProdukRequest.php

```
php
<?php

namespace App\Features\Produk\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProdukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or check auth permission
    }
    
    public function rules(): array
    {
        return [
            'nama' => 'required|string|max:255',
            'deskripsi' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'harga' => 'required|integer|min:0',
            'stok' => 'required|integer|min:0',
        ];
    }
    
    public function messages(): array
    {
        return [
            'nama.required' => 'Nama produk wajib diisi',
            'harga.integer' => 'Harga harus berupa angka',
        ];
    }
}
```

---

## 5. Resources (`app/Features/[Feature]/Resources/`)

### Purpose
Transform API responses, similar to frontend mappers.

### Example: ProdukResource.php

```
php
<?php

namespace App\Features\Produk\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProdukResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'deskripsi' => $this->deskripsi,
            'gambar' => $this->frontend?->gambar,
            'image_url' => $this->getImageUrl(),
            'category_id' => $this->category_id,
            'kategori' => $this->category?->nama,
            'harga' => $this->harga,
            'stok' => $this->stok,
            'rating' => (float) ($this->frontend?->rating ?? 0),
            'jumlah_review' => (int) ($this->frontend?->jumlah_review ?? 0),
        ];
    }
    
    private function getImageUrl(): ?string
    {
        $path = $this->frontend?->gambar;
        return $path ? asset('storage/' . ltrim($path, '/')) : null;
    }
}
```

---

## 6. Types/DTOs (`app/Features/[Feature]/Types/`)

### Purpose
Define data transfer objects, similar to frontend TypeScript types.

### Example: OrderTypes.php

```php
<?php

namespace App\Features\Order\Types;

class OrderTypes
{
    /**
     * @template T
     */
    class OrderCreate
    {
        public function __construct(
            public readonly int $userId,
            public readonly array $items,
            public readonly ?string $promoCode = null,
            public readonly ?array $shipping = null,
        ) {}
    }
    
    class OrderUpdate
    {
        public function __construct(
            public readonly ?string $status = null,
            public readonly ?array $shipping = null,
        ) {}
    }
    
    class OrderItem
    {
        public function __construct(
            public readonly int $produkItemId,
            public readonly int $quantity,
            public readonly int $harga,
        ) {}
    }
    
    class ShippingAddress
    {
        public function __construct(
            public readonly string $nama,
            public readonly string $telepon,
            public readonly string $alamat,
            public readonly string $kota,
            public readonly string $kodePos,
        ) {}
    }
}
```

---

## 7. Mappers (`app/Features/[Feature]/Mappers/`)

### Purpose
Transform data between layers (DTO to Model, API response to DTO).

### Example: OrderMapper.php

```
php
<?php

namespace App\Features\Order\Mappers;

use App\Features\Order\Types\OrderTypes;

class OrderMapper
{
    public static function toCreatePayload(OrderTypes\OrderCreate $order): array
    {
        return [
            'user_id' => $order->userId,
            'items' => array_map(fn($item) => [
                'produk_item_id' => $item->produkItemId,
                'quantity' => $item->quantity,
                'harga' => $item->harga,
            ], $order->items),
            'promo_code' => $order->promoCode,
            'shipping' => $order->shipping ? [
                'nama' => $order->shipping->nama,
                'telepon' => $order->shipping->telepon,
                'alamat' => $order->shipping->alamat,
                'kota' => $order->shipping->kota,
                'kode_pos' => $order->shipping->kodePos,
            ] : null,
        ];
    }
}
```

---

## 8. Controllers (Thin Controllers)

### Purpose
Controllers should be thin, delegating to Services.

### Example: ProdukController.php

```
php
<?php

namespace App\Http\Controllers;

use App\Features\Produk\Requests\StoreProdukRequest;
use App\Features\Produk\Services\ProdukService;
use App\Features\Produk\Resources\ProdukResource;
use Illuminate\Http\JsonResponse;

class ProdukController extends Controller
{
    public function __construct(
        private readonly ProdukService $produkService,
    ) {}
    
    public function index(): JsonResponse
    {
        $produk = $this->produkService->getAll();
        return response()->json([
            'data' => ProdukResource::collection($produk),
        ]);
    }
    
    public function show(int $id): JsonResponse
    {
        $produk = $this->produkService->getById($id);
        return response()->json([
            'data' => new ProdukResource($produk),
        ]);
    }
    
    public function store(StoreProdukRequest $request): JsonResponse
    {
        $produk = $this->produkService->create($request->validated());
        return response()->json([
            'data' => new ProdukResource($produk),
        ], 201);
    }
    
    // ... other methods
}
```

---

## 9. API Routes Structure

```
routes/
├── api.php                   # Main API routes
├── web.php                   # Web routes
└── api/
    ├── auth.php             # Auth routes
    ├── produk.php           # Produk routes
    ├── cart.php             # Cart routes
    ├── order.php            # Order routes
    ├── payment.php          # Payment routes
    └── wishlist.php         # Wishlist routes
```

### Example: routes/api.php

```
php
<?php

use Illuminate\Support\Facades\Route;
use App\Features\Auth\Controllers\AuthController;
use App\Features\Produk\Controllers\ProdukController;
use App\Features\Cart\Controllers\CartController;
use App\Features\Order\Controllers\OrderController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/produk', [ProdukController::class, 'index']);
Route::get('/produk/{id}', [ProdukController::class, 'show']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    
    // Orders
    Route::post('/checkout', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
});
```

---

## 10. Service Container Binding

### Example: AppServiceProvider.php

```
php
<?php

namespace App\Providers;

use App\Contracts\Auth\AuthContract;
use App\Features\Auth\Services\AuthService;
use App\Contracts\Produk\ProdukContract;
use App\Features\Produk\Services\ProdukService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind contracts to implementations
        $this->app->bind(AuthContract::class, AuthService::class);
        $this->app->bind(ProdukContract::class, ProdukService::class);
    }
    
    public function boot(): void
    {
        //
    }
}
```

---

## 11. Database/Migrations

```
database/
├── migrations/
│   ├── 2026_02_09_083206_create_users_table.php
│   ├── 2026_02_09_084106_create_categories_table.php
│   ├── 2026_02_09_084107_create_produk_items_table.php
│   ├── 2026_02_09_084332_create_orders_table.php
│   └── ...
└── seeders/
    ├── DatabaseSeeder.php
    ├── ProdukItemSeeder.php
    └── PromoCodeSeeder.php
```

---

## 12. Comparison: Frontend vs Backend

| Frontend (Next.js) | Backend (Laravel) |
|--------------------|-------------------|
| `features/auth/hooks/use-auth.ts` | `features/Auth/Services/AuthService.php` |
| `features/auth/types/user-auth-form.ts` | `features/Auth/Types/AuthTypes.php` |
| `features/auth/contract/auth-api-contract.ts` | `features/Auth/Contracts/AuthContract.php` |
| `features/auth/mapper/auth-mapper.ts` | `features/Auth/Mappers/AuthMapper.php` |
| `features/auth/schemas/auth-schemas.ts` | `features/Auth/Requests/LoginRequest.php` |
| `lib/core/http.ts` | `app/Services/HttpService.php` |
| `lib/generic/generic-hooks.ts` | `app/Services/BaseService.php` |

---

## 13. Summary

This backend architecture follows:

- **Feature-based organization** for scalability
- **Service layer pattern** for business logic
- **Contract/Interface pattern** for dependency injection
- **Request validation** similar to frontend Zod schemas
- **Resource transformers** similar to frontend mappers
- **Type/DTO pattern** similar to TypeScript types
- **Thin Controllers** delegating to Services
- **Laravel best practices** (Sanctum, Socialite, Dompdf)

---

## 14. Migration Plan

### Phase 1: Create Feature Structure
1. Create `app/Features/` directory
2. Create feature directories (Auth, Produk, Cart, Order, Payment, Wishlist, Category, Review, Promo, Profile)
3. Create Contracts for each feature

### Phase 2: Create Services
1. Extract business logic from Controllers to Services
2. Implement Contract interfaces
3. Register in Service Container

### Phase 3: Refactor Controllers
1. Make Controllers thin (delegate to Services)
2. Use Feature Requests for validation
3. Use Feature Resources for responses

### Phase 4: Create Types/DTOs
1. Create Type classes for data transfer
2. Create Mappers for transformation

### Phase 5: Testing
1. Test each Service
2. Ensure API contracts remain unchanged
3. Verify frontend integration works
