# RouteSync: Panduan Produk & Fitur

## Apa itu RouteSync

RouteSync adalah **code generator** yang mengubah definisi route Laravel menjadi **type-safe frontend SDKs**. Tool ini membuat library client TypeScript/JavaScript dari backend Laravel dengan validasi request/response otomatis dan inferensi tipe.

## Tujuan Utama

- **Input:** Metadata route Laravel (diekstrak via reflection dari running Laravel app)
- **Processing:** Analisis semantik, resolusi tipe, generasi kode
- **Output:** Typed SDKs (React hooks, Vue composables, plain TypeScript API clients) + validation schemas (Zod)

## Fitur Utama

### 1. Type Safety
- Inferensi otomatis tipe request/response dari backend Laravel
- Tidak perlu menulis interface TypeScript manual
- Full type checking di compile time

### 2. Schema Validation  
- Generate Zod schemas untuk form validation
- Runtime type checking
- Validasi data dari FormRequest Laravel

### 3. Framework Integration
- **React:** Hooks dengan React Query integration
- **Vue:** Composables dengan Vue Query integration  
- **Next.js:** Server Actions support

### 4. Multiple Output Formats
- SDK standalone
- React integration terpisah
- Vue integration terpisah
- TypeScript API clients

### 5. Manifest-Based Architecture
- Beroperasi pada format manifest file
- Capture complete route metadata
- Language-agnostic intermediate representation

## Use Case Utama

**Developer frontend** build fully typed API clients tanpa maintain request/response types manual. Ketika backend routes berubah, jalankan ulang RouteSync untuk regenerate dengan types baru.

**Workflow Typical:**
1. Backend dev update route Laravel
2. Frontend dev run `routesync scan` + `routesync generate`
3. Frontend otomatis dapat typed client terbaru
4. Zero manual sync, zero boilerplate

## Arsitektur Produk

### Packages Overview
- **CLI Package** (`@routesync/cli`): Generator pipeline dan command-line interface
- **Core Package** (`@routesync/core`): HTTP client engine, shared types dan utilities
- **React Package** (`@routesync/react`): React Query integration hooks
- **Vue Package** (`@routesync/vue`): Vue Query integration composables  
- **SDK Package** (`@routesync/sdk`): Core API client library

### Generator Pipeline
```
Laravel Routes → Parse → Semantic Analysis → IR Building → Code Emission
```

1. **Parse Phase:** Extract routes dari `routes/api.php` + model schemas
2. **Semantic Analysis:** Resolve types, relationships, dependencies
3. **IR Building:** Build intermediate representation yang unified
4. **Code Emission:** Generate ke berbagai target (TS, React, Vue, Zod)

## Fitur Detail

### Auto Type Inference (Zero Config)
```php
// ✅ Auto-detected - no annotation needed
public function show(User $user): JsonResponse {
    return new UserResource($user);
}

// ✅ Auto-detected - UserResource::collection → User[]
public function index(): JsonResponse {
    return UserResource::collection(User::all());
}
```

**7-Stage Inference Pipeline:**
1. PHP 8 `#[RouteSyncResponse]` attribute pada method
2. `return new UserResource($user)` di method body
3. `@mixin` docblock di Resource class
4. Constructor type hint resolution
5. Strip "Resource" suffix fallback
6. `toArray()` keys vs DB column matching
7. Manual annotation fallback

### Data Transformation Otomatis
| Direction | What happens | Where |
|---|---|---|
| Response (backend → frontend) | `snake_case` → `camelCase` keys | `HttpClient` interceptor |
| Request (frontend → backend) | `camelCase` → `snake_case` keys | `HttpClient` interceptor |
| Response unwrap | `{ data: T, message, meta }` → `T` | `HttpClient` methods |
| Zod validation | Parse + validate response shape | Per-endpoint `responseSchema` |

### Unified Query Hooks (Zero Boilerplate)
```tsx
import { useCart, useProduk } from '@/api'

// Direct resource unpacking
function ProdukList() {
  const { produk, isLoading } = useProduk() // Unpacks product list directly
  
  if (isLoading) return <p>Loading...</p>
  return (
    <ul>
      {produk?.map(p => <li key={p.id}>{p.nama}</li>)}
    </ul>
  )
}

// Domain actions (zero boilerplate)
function AddToCart({ produkItemId }: { produkItemId: number }) {
  const { inc } = useCart()
  
  return (
    <button onClick={() => inc(produkItemId)}>
      Tambah ke Keranjang
    </button>
  )
}
```

### Domain-Oriented Actions
Untuk specific domains seperti cart, RouteSync generate helper methods:
- `cart.inc(produkItemId)` - Increment item quantity
- `cart.dec(produkItemId)` - Decrement quantity (remove jika < 1)  
- `cart.remove(produkItemId)` - Remove item from cart
- `cart.add(produkItemId, qty)` - Add item to cart
- `cart.applyPromo(code)` - Apply promo code
- `cart.removePromo()` - Remove promo code

## Generated Output Structure

```
src/api/
├── api.ts        ← defineApi() dengan semua endpoints + Contract types
├── types.ts      ← TypeScript interfaces (real DB columns ketika --models)
├── hooks.ts      ← useApiQuery / useApiMutation per endpoint
├── actions.ts    ← Next.js Server Actions (--next-actions)
├── schemas.ts    ← Zod schemas dari FormRequest rules (--zod)  
├── index.ts      ← Barrel re-export
└── core/
    └── models.ts ← Raw Eloquent model interfaces (ketika --models)
```

## CLI Commands

### 1. Auto-annotate (One-time Setup)
```bash
# Preview apa yang akan di-inject
npx routesync annotate --input routes/api.php --dry-run

# Apply injection ke controller methods
npx routesync annotate --input routes/api.php

# Re-annotate yang sudah punya annotation
npx routesync annotate --input routes/api.php --force
```

### 2. Scan Routes & Models
```bash
# Scan routes saja
npx routesync scan --input routes/api.php

# Scan routes + Eloquent models (recommended)
npx routesync scan --input routes/api.php --models --baseURL http://localhost/api
```

### 3. Generate SDK
```bash
# Basic SDK generation  
npx routesync generate --manifest routesync.manifest.json --output src/api

# Dengan semua fitur
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod --msw
```

### 4. Watch Mode
```bash
# Auto re-generate saat route file berubah
npx routesync watch --input routes/api.php --output src/api
```

## Integrasi dengan Framework

### React (dengan TanStack Query)
```bash
npm install routesync @tanstack/react-query
```

```tsx
// Initialize client
import { createClient } from 'routesync'

createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  withCredentials: true,
})

// Use hooks
import { useCart } from '@/api'

const { cart, isLoading } = useCart()
const createMutation = useCart.create()
```

### Vue (dengan TanStack Vue Query)
```bash
npm install routesync @tanstack/vue-query
```

```vue
<script setup>
import { useCart } from '@/api'

const { cart, isLoading } = useCart()
const { inc } = useCart()
</script>
```

### Next.js Server Actions
```ts
import { produkGetAction, cartPostItemsAction } from '@/api/actions'

// GET dengan params
const result = await produkGetAction({ query: { page: 1 } })

// POST dengan body  
const result = await cartPostItemsAction({ 
  body: { produk_item_id: '5', qty: 1 } 
})

// GET dengan path params
const result = await produkGetIdAction({ params: { id: '42' } })
```

## Authentication

```ts
import { createClient } from 'routesync'

const client = createClient({ baseURL: 'https://api.myapp.com/api' })

// Set token setelah login
client.setToken(response.token)

// Clear token saat logout
client.removeToken()
```

Endpoint dengan `auth: true` otomatis dapat `Authorization: Bearer TOKEN`.

## Global Toast Notifications

```ts
import { createClient } from 'routesync'
import { toast } from 'sonner'

createClient({
  baseURL: '/api',
  toast: {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg)
  }
})
```

RouteSync otomatis display success/error notifications untuk mutations.

## Validation dengan Zod

Butuh Laravel `FormRequest` classes:

```php
// ✅ RouteSync akan auto-generate Zod schema
public function store(StoreProductRequest $request) { ... }

// ❌ Rules tidak akan terdetect
public function store(Request $request) {
    $request->validate([...]);
}
```

## Requirements

- **Node.js:** >= 20
- **PHP:** Available di PATH (untuk `scan --models` dan `annotate`)
- **Laravel project:** Dengan database accessible (untuk `scan --models`)

## Current Focus & Roadmap

### Active Development
- **Consolidation:** Menggabungkan duplicate semantic resolution logic
- **Single IR:** Establish unified intermediate representation untuk type decisions
- **Performance:** Optimasi untuk large codebases
- **Error Handling:** Better error messages dan debugging

### Upcoming Features
- **OpenAPI Support:** Generate dari OpenAPI specs selain Laravel
- **GraphQL Integration:** Support untuk GraphQL endpoints
- **Mock Generation:** Enhanced MSW mock handlers
- **Multi-Framework:** Support framework selain Laravel (Symfony, etc.)

## Best Practices

### 1. Naming Conventions
- Resource classes: `UserResource` → `User` model
- Controller methods: Follow RESTful naming
- FormRequest classes: `StoreUserRequest`, `UpdateUserRequest`

### 2. Type Safety
- Selalu gunakan `--models` flag untuk real DB column types
- Manual annotate jika Resource name tidak match model
- Review generated types sebelum commit

### 3. Performance  
- Large manifests bisa lambat - consider breaking ke smaller chunks
- Watch mode untuk development, manual generate untuk production
- Cache manifest files untuk CI/CD

### 4. Team Workflow
- Backend team: Run `annotate` setelah add new endpoints
- Frontend team: Run `scan` + `generate` setelah backend changes
- Version control manifest files untuk reproducible builds