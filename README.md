# RouteSync

> Stop writing API clients by hand.

RouteSync syncs your Laravel (or PHP) routes to a fully-typed frontend SDK — complete with TypeScript types, a camelCase mapper, React/Vue Query hooks, and Next.js Server Actions. One command. Zero boilerplate.

---

## Why

You've been there. The backend ships a new endpoint. You update the route, write a fetch wrapper, add the TypeScript type, hook it into React Query, map `snake_case` to `camelCase`, and fifteen minutes later you're still not done.

RouteSync does all of that. You point it at `routes/api.php` and it generates the whole thing.

```bash
# Step 1 — in your Laravel folder
npx routesync annotate --input routes/api.php  # auto-inject #[Response] to controllers
npx routesync scan --input routes/api.php --models

# Step 2 — in your frontend folder
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod
```

```
✔ Annotated 12 method(s) across 6 controller file(s)

✔ Found 35 routes, 19 models → routesync.manifest.json

✔ SDK generated → src/api
  api.ts      Typed API client
  types.ts    TypeScript interfaces (from real DB columns)
  hooks.ts    React Query hooks
  actions.ts  Next.js Server Actions
  schemas.ts  Zod validation schemas
  index.ts    Barrel export
```

That's it. Your frontend has a typed client, real DB-derived types, Zod schemas, and ready-to-use hooks — and you didn't write any of it.

---

## Packages

| Package | What it does |
|---|---|
| `@routesync/sdk` | The core developer API. `defineApi`, `endpoint`, `resource`, `createService`. |
| `@routesync/core` | HTTP client engine, auth, path resolution, error handling. |
| `@routesync/cli` | Scans routes + models, generates types + SDK + hooks + actions. |
| `@routesync/react` | `useApiQuery` / `useApiMutation` hooks built on TanStack Query. |
| `@routesync/vue` | Vue Query composables, same idea. |

---

## Install

```bash
# SDK + React hooks
npm install routesync @tanstack/react-query

# Vue composables
npm install routesync @tanstack/vue-query

# With Zod validation
npm install routesync zod
```

---

## Full Workflow (Laravel + Next.js)

### 1. Auto-annotate controllers (one-time setup)

Run this from your **Laravel project root** to auto-inject `#[Response]` attributes into every controller method:

```bash
npx routesync annotate --input routes/api.php
```

| Option | Description |
|---|---|
| `--input <file>` | Path to routes file (default: `routes/api.php`) |
| `--dry-run` | Preview what would be injected without writing files |
| `--force` | Re-annotate methods that already have `#[Response]` |

This command:
- Detects `return new XxxResource(...)` / `XxxResource::collection(...)` / `response()->json(new XxxResource(...))` in each controller method
- Resolves the model from the Resource's `@mixin` docblock (or strips the `Resource` suffix as fallback)
- Injects `#[Response(Model::class)]` or `#[Response(Model::class, collection: true)]` above the method
- Adds `use App\Attributes\Response;` to controller imports automatically
- Creates `app/Attributes/Response.php` if it doesn't exist yet

> **Tip:** Preview first with `--dry-run`:
> ```bash
> npx routesync annotate --input routes/api.php --dry-run
> ```

You only need to run this once, or again when you add new endpoints.

### 2. Scan routes & models

Run this from your **Laravel project root**:

```bash
npx routesync scan --input routes/api.php --models
```

| Option | Default | Description |
|---|---|---|
| `--input` | `routes/api.php` | Path to your Laravel routes file |
| `--output` | `routesync.manifest.json` | Where to save the manifest |
| `--baseURL` | `http://localhost/api` | API base URL |
| `--models` | off | Also scan `app/Models/` for real DB column types |

> **`--models` requirement:** PHP must be available in your terminal and your database must be accessible (`.env` configured). The scanner runs a temporary PHP script via Laravel's bootstrap to read `Schema::getColumns()` from each Eloquent model.

> **Important — manifest location:** The manifest is saved in whichever folder you run `scan` from. If you run it from your Laravel root, copy the manifest to your frontend folder before running `generate`:
>
> ```bash
> # Windows PowerShell
> copy ..\routesync.manifest.json .
>
> # macOS / Linux
> cp ../backend/routesync.manifest.json .
> ```

### 3. Generate the SDK

Run this from your **frontend project root**:

```bash
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod
```

| Option | Default | Description |
|---|---|---|
| `--manifest` | `routesync.manifest.json` | Path to manifest from step 2 |
| `--output` | `src/api` | Output folder |
| `--next-actions` | off | Generate `actions.ts` (Next.js Server Actions) |
| `--zod` | off | Generate `schemas.ts` (Zod validation) |
| `--no-hooks` | off | Skip generating `hooks.ts` |
| `--msw` | off | Generate MSW mock handlers |

> **Windows PowerShell note:** Do not use backslash `\` for line continuation. Run the command on a single line:
>
> ```powershell
> npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod
> ```

### Generated files

```
src/api/
├── api.ts        ← defineApi() with all endpoints + Contract types
├── types.ts      ← TypeScript interfaces (real DB columns when --models used)
├── hooks.ts      ← useApiQuery / useApiMutation per endpoint
├── actions.ts    ← Next.js Server Actions (--next-actions)
├── schemas.ts    ← Zod schemas from FormRequest rules (--zod)
├── index.ts      ← Barrel re-export
└── core/
    └── models.ts ← Raw Eloquent model interfaces (when --models used)
```

### 4. Initialize the client

Call `createClient` once at app startup (e.g. in your layout or provider):

```ts
// src/lib/api-client.ts
import { createClient } from 'routesync'

createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!, // e.g. http://localhost:8000/api
  withCredentials: true,
})
```

### 5. Use in components

```tsx
import { useCart, useProduk } from '@/api'

// GET — fetch list of products
function ProdukList() {
  const { produk, isLoading } = useProduk() // Unpacks product list directly

  if (isLoading) return <p>Loading...</p>
  return (
    <ul>
      {produk?.map(p => (
        <li key={p.id}>{p.nama}</li>
      ))}
    </ul>
  )
}

// GET with path params — detail hook
function ProdukDetail({ id }: { id: number }) {
  const { produk } = useProduk.show(id)
  return <div>{produk?.nama}</div>
}

// POST / mutation — zero-boilerplate domain actions
function AddToCart({ produkItemId }: { produkItemId: number }) {
  const { inc } = useCart()

  return (
    <button onClick={() => inc(produkItemId)}>
      Tambah ke Keranjang
    </button>
  )
}
```

### 6. Use Server Actions (Next.js)

```ts
import { produkGetAction, cartPostItemsAction } from '@/api/actions'

// GET — no params needed
const result = await produkGetAction({ query: { page: 1 } })
if (result.success) console.log(result.data)

// POST — with body
const result = await cartPostItemsAction({ body: { produk_item_id: '5', qty: 1 } })

// GET with path params — params are required
const result = await produkGetIdAction({ params: { id: '42' } })
```

---

## Response Type Inference

RouteSync automatically infers the TypeScript response type for each endpoint. The scanner works through **7 stages in order**, stopping at the first successful match.

### How inference works

```
Controller method
      │
      ▼
Stage 1: PHP 8 #[RouteSyncResponse] attribute on method  ← most explicit
      │
      ▼
Stage 2: return new UserResource($user) in method body
      │  ├─ Stage 2a: #[RouteSyncResponse] on Resource class
      │  ├─ Stage 2b: @mixin \App\Models\User docblock
      │  ├─ Stage 2c: __construct(User $user) type hint
      │  ├─ Stage 2d: @var User $resource docblock
      │  ├─ Stage 2e: Strip "Resource" suffix → App\Models\*
      │  └─ Stage 2f: toArray() keys vs DB column matching
      │
      ▼
Stage 3: response()->json([...]) inline array
         keys matched against DB columns (min score 2)
      │
      ▼
  response: unknown  ← annotate manually if all stages fail
```

### Zero-config inference (no annotation needed)

For the common convention `UserResource` → `User`, RouteSync infers automatically:

```php
// ✅ Auto-detected — no annotation needed
public function show(User $user): JsonResponse
{
    return new UserResource($user);
}

// ✅ Auto-detected — UserResource::collection → User[]
public function index(): JsonResponse
{
    return UserResource::collection(User::all());
}
```

### Auto-annotate with CLI (recommended)

Instead of adding `#[Response]` by hand, let the CLI do it:

```bash
# Preview first
npx routesync annotate --input routes/api.php --dry-run

# Apply
npx routesync annotate --input routes/api.php
```

This scans every controller method, detects which Resource it returns, resolves the model, and injects `#[Response(Model::class)]` automatically. See [Auto-annotate controllers](#1-auto-annotate-controllers-one-time-setup) for details.

### Manual annotation with PHP 8 Attribute

Use `#[RouteSyncResponse]` when auto-inference fails — for example when the Resource name doesn't match the model, or the response is a DTO/custom shape.

**Step 1 — Create the attribute class** (`app/Attributes/RouteSyncResponse.php`):

```php
<?php

namespace App\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_CLASS)]
class RouteSyncResponse
{
    public function __construct(
        public readonly string $model,
        public readonly bool $collection = false,
    ) {}
}
```

**Step 2 — Annotate your controller method:**

```php
use App\Attributes\RouteSyncResponse;
use App\Models\User;

class AuthController extends Controller
{
    #[RouteSyncResponse(model: User::class)]
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());
        $token = $user->createToken('auth')->plainTextToken;
        return response()->json(['token' => $token, 'user' => new UserResource($user)]);
    }

    #[RouteSyncResponse(model: User::class, collection: true)]
    public function index(): JsonResponse
    {
        return response()->json(User::all());
    }
}
```

**Or annotate the Resource class directly** (applies to all endpoints that return this Resource):

```php
use App\Attributes\RouteSyncResponse;
use App\Models\User;

#[RouteSyncResponse(model: User::class)]
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'email' => $this->email];
    }
}
```

> **Priority:** annotation on controller method > annotation on Resource class > auto-inference.

### When to annotate manually

| Situation | Solution |
|---|---|
| Resource name doesn't match model (`PublicProfileResource` → `User`) | `#[RouteSyncResponse(model: User::class)]` |
| Response is a DTO, not an Eloquent model | Add model manually after generate |
| Controller returns `response()->json([...])` without a Resource | `#[RouteSyncResponse(model: User::class)]` |
| Multiple models in one response | Add model manually after generate |
| Response is still `unknown` after scan | Add `#[RouteSyncResponse]` attribute |

---

## Data Transformation

RouteSync handles all data mapping automatically:

| Direction | What happens | Where |
|---|---|---|
| Response (backend → frontend) | `snake_case` → `camelCase` keys | `HttpClient` interceptor |
| Request (frontend → backend) | `camelCase` → `snake_case` keys | `HttpClient` interceptor |
| Response unwrap | `{ data: T, message, meta }` → `T` | `HttpClient` `.get()` / `.post()` etc. |
| Zod validation | Parse + validate response shape | Per-endpoint `responseSchema` |

No extra config needed. `product_name` from Laravel becomes `productName` in your component automatically.

---

## Manual Route Definitions

If you don't have a Laravel backend, define routes manually:

```ts
import { defineApi, endpoint, resource } from 'routesync'

createClient({ baseURL: 'https://api.myapp.com/api' })

export const api = defineApi({
  auth: {
    login:  endpoint<{ token: string }>({ method: 'POST', path: '/login' }),
    logout: endpoint({ method: 'POST', path: '/logout', auth: true }),
  },
  produk: {
    list:   endpoint<ProdukItem[]>({ method: 'GET', path: '/produk' }),
    detail: endpoint<ProdukItem, { id: string }>({ method: 'GET', path: '/produk/:id' }),
    create: endpoint<ProdukItem, unknown, CreateProdukBody>({
      method: 'POST', path: '/produk', auth: true
    }),
  },
  cart: resource({
    auth: true,
    endpoints: {
      get:    { method: 'GET',    path: '/cart' },
      add:    { method: 'POST',   path: '/cart/items' },
      update: { method: 'PATCH',  path: '/cart/items/:id' },
      remove: { method: 'DELETE', path: '/cart/items/:id' },
    }
  })
})
```

`endpoint<TResponse, TParams, TBody>` — generic order:
1. **TResponse** — shape returned by the backend
2. **TParams** — path params like `{ id: string }`
3. **TBody** — POST/PUT/PATCH body shape

---

## Authentication

```ts
import { createClient } from 'routesync'

const client = createClient({ baseURL: 'https://api.myapp.com/api' })

// After login — set token
client.setToken(response.token)

// On logout — clear token
client.removeToken()
```

Any endpoint with `auth: true` automatically gets `Authorization: Bearer TOKEN` injected. For Next.js Server Actions, the generated `actions.ts` reads the token from cookies automatically via `getAuthHeaders()`.

---

## React Query Hooks

RouteSync generates a highly organized, declarative hook system built on top of TanStack Query. Instead of writing wrapper components or calling `useQuery` manually, RouteSync generates a centralized hook registry configured via a declarative Domain Specific Language (DSL).

### Auto-generated `hooks.ts` Structure

When you run `npx routesync generate`, RouteSync outputs `src/api/hooks.ts` containing:

```typescript
import { defineHooks } from 'routesync/react'
import { api } from './api'
import { QueryKey } from './query-key'
import type {
  ProdukItemResourceIndex,
  ProdukItemResourceShow,
  AdminProdukForm,
} from './types'

export const typeOf = <T>() => ({} as T)

export const hooks = defineHooks({
  produk: {
    // 1. Compile-Time Resource Schema Metadata (Type Registry)
    types: {
      list: typeOf<ProdukItemResourceIndex>(),
      detail: typeOf<ProdukItemResourceShow>(),
      create: typeOf<never>(),
      update: typeOf<never>(),
    },
    queryKey: QueryKey.produk,
    endpoint: api.produk,
  },
  adminProduk: {
    types: {
      list: typeOf<never>(),
      detail: typeOf<never>(),
      create: typeOf<AdminProdukForm['Create']>(),
      update: typeOf<never>(),
    },
    queryKey: QueryKey.adminProduk,
    endpoint: api.adminProduk,
  }
})

// Unified hook exports per domain resource group
export const useProduk = hooks.produk
export const useAdminProduk = hooks.adminProduk
```

### Using Hooks in Components

For standard REST/CRUD actions, you call the unified resource hooks directly. All payload and return types are fully inferred from the metadata registry:

```tsx
import { useProduk } from '@/api/hooks'

function ProductCatalog() {
  // 1. GET (Index) — List all products (inferred as ProdukItemResourceIndex)
  const { data: products, isLoading } = useProduk.index()

  // 2. GET (Show) — View specific product details (inferred as ProdukItemResourceShow)
  const { data: detail } = useProduk.show(42)

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      <h1>{detail?.nama}</h1>
      <ul>
        {products?.map(p => <li key={p.id}>{p.nama}</li>)}
      </ul>
    </div>
  )
}
```

For actions that require mutations, call the hook and use the mutation helpers:

```tsx
import { useAdminProduk } from '@/api/hooks'

function CreateProductForm() {
  const createMutation = useAdminProduk.create()

  const handleSubmit = (formData: any) => {
    // Payload type (AdminProdukForm['Create']) is automatically enforced here
    createMutation.mutate(formData, {
      onSuccess: () => console.log('Product created!')
    })
  }

  return <button onClick={() => handleSubmit({ nama: 'Kaos', ... })}>Create</button>
}
```

### Custom Non-CRUD Action Hooks

Endpoints that do not fit into the standard CRUD pattern (e.g. `POST /login`, `PATCH /profile`) are automatically exposed on the same resource hook namespace as custom hooks:

```ts
import { useLogin, useProfile } from '@/api/hooks'

// Login mutation (POST /login)
const login = useLogin.useCreate()
login.mutate({ email, password })

// Profile update (PATCH /profile)
const updateProfile = useProfile.usePatch()
updateProfile.mutate({ name, email })
```

### Declarative Cache Invalidation

You can define custom, cross-resource query cache invalidation rules using the `cache` metadata property. This ensures that when a mutation succeeds, related queries are automatically refreshed:

```typescript
export const hooks = defineHooks({
  orders: {
    types: {
      list: typeOf<OrderResourceIndex>(),
      detail: typeOf<OrderResourceShow>(),
      create: typeOf<OrderForm['Create']>(),
      update: typeOf<never>(),
    },
    queryKey: QueryKey.orders,
    endpoint: api.orders,

    // Cache metadata defines runtime invalidation strategies
    cache: {
      create: {
        invalidate: [
          QueryKey.orders.lists,  // Refreshes the orders history list
          QueryKey.cart.summary,  // Refreshes the shopping cart summary query
        ]
      }
    }
  }
})
```


---

## Unified Query Hooks & Zero-Boilerplate Actions

RouteSync supports high-productivity, zero-boilerplate API client and React Query integration options.

### 1. Unified Query Hooks & Direct Property Unpacking
Instead of manually renaming `data` to reference specific resources, RouteSync hooks expose the resource names directly at the top-level along with standard React Query states:

```tsx
import { useCart } from '@/api'

function CartComponent() {
  const { cart, isLoading, error } = useCart() // Unpacks cart state directly

  if (isLoading) return <p>Loading...</p>
  return <div>Total items: {cart?.items.length}</div>
}
```

This works identically on canonical queries:
```tsx
const { cart, isLoading } = useCart.index()
```

### 2. Domain-Oriented Intent Patterns (Cart Actions)
When mapping specific groups to domain behaviors in `routesync.manifest.json`:
```json
"frontend": {
  "domains": {
    "cart": "cart"
  }
}
```
RouteSync CLI automatically generates and attaches zero-boilerplate helper methods directly to the query hook:
- `cart.inc(produkItemId)` — Increments item quantity
- `cart.dec(produkItemId)` — Decrements item quantity (removes if < 1)
- `cart.remove(produkItemId)` — Removes item from cart
- `cart.add(produkItemId, qty)` — Adds item to cart
- `cart.applyPromo(code)` — Applies promo code
- `cart.removePromo()` — Removes promo code

All underlying API payloads, request mappings, and updates vs creations logic are handled behind-the-scenes by the wrapper hook.

### 3. Global Toast Notifications
Register a global `toast` handler when initializing your client, and RouteSync will automatically display success/error notifications for your mutations (create, update, delete) without importing toast libraries on every page:

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

---

## Zod Schema Validation

When using `--zod` with `routesync generate`, `schemas.ts` is generated from your Laravel `FormRequest` rules.

> **Requirement:** You must use Laravel `FormRequest` classes for rules to be detected:
>
> ```php
> // ✅ RouteSync will auto-generate Zod schema
> public function store(StoreProductRequest $request) { ... }
>
> // ❌ Rules will not be detected
> public function store(Request $request) {
>     $request->validate([...]);
> }
> ```

---

## CLI Reference

```bash
# Auto-inject #[Response] attributes into controller methods
npx routesync annotate --input routes/api.php

# Preview without writing files
npx routesync annotate --input routes/api.php --dry-run

# Re-annotate already-annotated methods
npx routesync annotate --input routes/api.php --force

# Scan Laravel routes only
npx routesync scan --input routes/api.php

# Scan routes + Eloquent models (recommended)
npx routesync scan --input routes/api.php --models

# Generate SDK from manifest
npx routesync generate --manifest routesync.manifest.json --output src/api

# Generate everything
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod

# Watch mode — auto re-generates on route file change
npx routesync watch --input routes/api.php --output src/api
```

---

## How It Works

```
routes/api.php + app/Models/
         │
         ▼
npx routesync annotate        ← inject #[Response] into controllers
         │
         ▼
npx routesync scan --models   ← read routes + DB columns → manifest
         │
         ▼
   routesync.manifest.json
         │
         ▼
npx routesync generate        ← generate SDK from manifest
         │
         ▼
   src/api/
    ├── api.ts       ← defineApi + endpoints + Contract types
    ├── types.ts     ← interfaces from DB columns
    ├── hooks.ts     ← TanStack Query hooks
    ├── actions.ts   ← Next.js Server Actions
    └── schemas.ts   ← Zod schemas
         │
         ▼
   React / Vue / Next.js
```

The CLI parses your route file via PHP reflection (using Laravel's own bootstrap), builds a language-agnostic manifest, then feeds it to independent generators. Each generator can be used standalone.

---

## Requirements

- Node.js >= 20
- PHP available in PATH (for `scan --models` and `annotate`)
- Laravel project with database accessible (for `scan --models`)

## License

MIT