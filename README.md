# RouteSync

> Stop writing API clients by hand.

RouteSync syncs your Laravel (or PHP) routes to a fully-typed frontend SDK — complete with TypeScript types, a camelCase mapper, React/Vue Query hooks, and Next.js Server Actions. One command. Zero boilerplate.

---

## Why

You've been there. The backend ships a new endpoint. You update the route, write a fetch wrapper, add the TypeScript type, hook it into React Query, map `snake_case` to `camelCase`, and fifteen minutes later you're still not done.

RouteSync does all of that. You point it at `routes/api.php` and it generates the whole thing.

```bash
# Step 1 — in your Laravel folder
npx routesync scan --input routes/api.php --models

# Step 2 — in your frontend folder
npx routesync generate --manifest routesync.manifest.json --output src/api --next-actions --zod
```

```
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

### 1. Scan routes & models

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

### 2. Generate the SDK

Run this from your **frontend project root**:

```bash
npx routesync generate \
  --manifest routesync.manifest.json \
  --output src/api \
  --next-actions \
  --zod
```

| Option | Default | Description |
|---|---|---|
| `--manifest` | `routesync.manifest.json` | Path to manifest from step 1 |
| `--output` | `src/api` | Output folder |
| `--next-actions` | off | Generate `actions.ts` (Next.js Server Actions) |
| `--zod` | off | Generate `schemas.ts` (Zod validation) |
| `--no-hooks` | off | Skip generating `hooks.ts` |
| `--msw` | off | Generate MSW mock handlers |

> **Windows PowerShell note:** Do not use backslash `\` for line continuation — PowerShell treats it differently. Run the command on a single line:
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

### 3. Initialize the client

Call `createClient` once at app startup (e.g. in your layout or provider):

```ts
// src/lib/api-client.ts
import { createClient } from 'routesync'

createClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!, // e.g. http://localhost:8000/api
  withCredentials: true,
})
```

### 4. Use in components

```tsx
import { useApiQuery, useApiMutation } from 'routesync/react'
import { api } from '@/api/api'

// GET — fetch data
function ProdukList() {
  const { data, isLoading } = useApiQuery(api.produk.get, {
    query: { page: 1, search: 'kaos' }
  })

  if (isLoading) return <p>Loading...</p>
  return <ul>{data?.map(p => <li key={p.id}>{p.nama}</li>)}</ul>
}

// GET with path params
function ProdukDetail({ id }: { id: string }) {
  const { data } = useApiQuery(api.produk.getId, { params: { id } })
  return <div>{data?.nama}</div>
}

// POST / mutation
function AddToCart({ produkItemId }: { produkItemId: string }) {
  const mutation = useApiMutation(api.cart.postItems)

  return (
    <button onClick={() => mutation.mutate({ body: { produk_item_id: produkItemId, qty: 1 } })}>
      Tambah ke Keranjang
    </button>
  )
}
```

### 5. Use Server Actions (Next.js)

```ts
// In a Server Component or form action
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
  // Basic endpoint
  auth: {
    login:  endpoint<{ token: string }>({ method: 'POST', path: '/login' }),
    logout: endpoint({ method: 'POST', path: '/logout', auth: true }),
  },

  // With path params
  produk: {
    list:   endpoint<ProdukItem[]>({ method: 'GET', path: '/produk' }),
    detail: endpoint<ProdukItem, { id: string }>({ method: 'GET', path: '/produk/:id' }),
    create: endpoint<ProdukItem, unknown, CreateProdukBody>({
      method: 'POST', path: '/produk', auth: true
    }),
  },

  // resource() — shared auth/headers for a group
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

### Auto-generated hooks (from CLI)

```ts
import { useApiQuery, useApiMutation } from 'routesync/react'
import { api } from '@/api/api'

// GET
const { data, isLoading } = useApiQuery(api.orders.get)

// GET with params + query
const { data } = useApiQuery(api.orders.getId, { params: { id: '1' } })

// Mutation
const mutation = useApiMutation(api.cart.postItems)
mutation.mutate({ body: { produk_item_id: '5', qty: 1 } })
```

### Generate hooks for entire api at once

```ts
import { generateHooks } from 'routesync'

const hooks = generateHooks(api)
const { useOrdersGet, useCartPostItems } = hooks
// GET/DELETE → useQuery, everything else → useMutation
```

### createHooks — per group

```ts
import { createHooks } from 'routesync/react'

const cartHooks = createHooks(api.cart)
const { usePostItems, usePatchItemsProdukItemId } = cartHooks
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
         ↓  routesync scan --models
   routesync.manifest.json
         ↓  routesync generate
   src/api/
    ├── api.ts       ← defineApi + endpoints
    ├── types.ts     ← interfaces from DB columns
    ├── hooks.ts     ← TanStack Query hooks
    ├── actions.ts   ← Next.js Server Actions
    └── schemas.ts   ← Zod schemas
         ↓
   React / Vue / Next.js
```

The CLI parses your route file via PHP reflection (using Laravel's own bootstrap), builds a language-agnostic manifest, then feeds it to independent generators. Each generator can be used standalone.

---

## Requirements

- Node.js >= 20
- PHP available in PATH (for `scan --models`)
- Laravel project with database accessible (for `scan --models`)

## License

MIT