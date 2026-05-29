# RouteSync

> Laravel routes to typed frontend SDKs.

Modern API SDK ecosystem for Laravel and PHP with typed clients, hooks, route syncing, and code generation.

---

## Packages

| Package | Description |
|---|---|
| `@routesync/core` | HTTP client engine, auth, routing, error handling |
| `@routesync/sdk` | Developer-facing API: `defineApi`, `createService` |
| `@routesync/cli` | CLI: scan routes, generate SDK, types, hooks |
| `@routesync/react` | React Query hooks factory |
| `@routesync/vue` | Vue Query composables factory |

---

## Quick Start

### 1. Install

```bash
npm install @routesync/sdk
```

### 2. Define your API

```ts
import { defineApi } from '@routesync/sdk'

export const api = defineApi(
  {
    auth: {
      login:  { method: 'POST', path: '/login' },
      logout: { method: 'POST', path: '/logout', auth: true }
    },
    produk: {
      list:   { method: 'GET',  path: '/produk' },
      detail: { method: 'GET',  path: '/produk/:id' }
    },
    cart: {
      addItem:    { method: 'POST',   path: '/cart/items', auth: true },
      removeItem: { method: 'DELETE', path: '/cart/items/:produkItemId', auth: true }
    }
  },
  {
    baseURL: 'http://localhost:8000/api'
  }
)
```

### 3. Use it

```ts
// Login
await api.auth.login({ body: { email, password } })

// Get product list
await api.produk.list({ query: { page: 1, search: 'kaos' } })

// Get product detail (auto path param)
await api.produk.detail({ params: { id: 10 } })
// → GET /produk/10

// Add to cart
await api.cart.addItem({ body: { produk_id: 1, qty: 2 } })

// Remove from cart
await api.cart.removeItem({ params: { produkItemId: 5 } })
// → DELETE /cart/items/5
```

---

## CLI: Auto-generate from Laravel Routes

### Install CLI

```bash
npm install -g @routesync/cli
```

### Sync in one command

```bash
npx routesync sync \
  --input routes/api.php \
  --output src/api \
  --baseURL https://api.myapp.com/api
```

Output:

```
  routesync sync

  ✔ Scanning Laravel routes (24 routes)
  ✔ Generating types
  ✔ Generating SDK
  ✔ Generating hooks

  Sync complete!

  Output: src/api
```

Generated files:

```
src/api/
├── api.ts       ← Typed API client
├── types.ts     ← Response/request types
└── hooks.ts     ← React Query hooks
```

### Available Commands

```bash
npx routesync scan      # Scan routes → manifest JSON
npx routesync generate  # Generate SDK from manifest
npx routesync sync      # Scan + generate in one step
npx routesync watch     # Watch and auto-sync on changes
```

---

## React Query Hooks

```bash
npm install @routesync/react
```

```ts
import { z } from 'zod'
import { createHooks } from '@routesync/react'
import { createService } from '@routesync/sdk'
import type { CamelCasedPropertiesDeep } from '@routesync/sdk'

type BackendProduct = {
  id: number
  product_name: string
  created_at: string
}

type Product = CamelCasedPropertiesDeep<BackendProduct>

type ProductInput = {
  productName: string
}

const backendProductSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  created_at: z.string()
})

const productInputSchema = z.object({
  productName: z.string().min(1)
})

const productService = createService<Product, ProductInput>(client, '/produk', {
  entitySchema: backendProductSchema,
  listSchema: z.array(backendProductSchema),
  createSchema: productInputSchema
})

const { useList, useDetail, useCreate } = createHooks(productService, 'produk')

// In component:
const { data, isLoading } = useList({ page: 1 })
const mutation = useCreate()

// Frontend camelCase payload is validated with Zod, then sent as snake_case.
mutation.mutate({ productName: 'Product Baru' })

// Backend snake_case response becomes frontend camelCase.
data?.[0].productName
```

---

## Vue Query Composables

```bash
npm install @routesync/vue
```

```ts
import { createVueComposables } from '@routesync/vue'

const { useList, useCreate } = createVueComposables(productService, 'produk')
```

---

## Authorization

```ts
import { createClient } from '@routesync/sdk'

const { setToken, clearToken } = createClient({
  baseURL: 'https://api.myapp.com/api'
})

// After login:
setToken(response.data.token)

// After logout:
clearToken()
```

Routes with `auth: true` automatically get `Authorization: Bearer TOKEN` injected.

---

## Multi-Backend Support

```ts
// Laravel
const laravel = defineApi(routes, { baseURL: 'https://laravel-app.com/api' })

// CodeIgniter
const ci = defineApi(routes, { baseURL: 'https://ci-app.com/api' })

// Native PHP
const php = defineApi(routes, { baseURL: 'https://native-php.com/api' })
```

---

## Ecosystem Flow

```
Laravel Backend
      ↓
npx routesync sync
      ↓
Route Manifest (JSON)
      ↓
SDK Generator
      ↓
Typed Client  +  Types  +  Hooks
      ↓
React / Vue / Next.js / Mobile / AI Agent
```

---

## License

MIT
