# RouteSync

> Stop writing API clients by hand.

RouteSync syncs your Laravel (or PHP) routes to a fully-typed frontend SDK — complete with TypeScript types, a camelCase mapper, and React/Vue Query hooks. One command. Zero boilerplate.

---

## Why

You've been there. The backend ships a new endpoint. You update the route, write a fetch wrapper, add the TypeScript type, hook it into React Query, map `snake_case` to `camelCase`, and fifteen minutes later you're still not done.

RouteSync does all of that. You point it at `routes/api.php` and it generates the whole thing.

```bash
npx routesync sync --input routes/api.php --output src/api --baseURL https://api.myapp.com/api
```

```
  routesync sync

  ✔ Scanning Laravel routes (24 routes)
  ✔ Generating types
  ✔ Generating SDK
  ✔ Generating hooks

  Sync complete! → src/api
```

That's it. Your frontend has a typed client, response types, and ready-to-use hooks — and you didn't write any of it.

---

## Packages

| Package | What it does |
|---|---|
| `@routesync/sdk` | The core developer API. `defineApi`, `createService`, `resource`. |
| `@routesync/core` | HTTP client engine, auth, path resolution, error handling. |
| `@routesync/cli` | Scans routes, generates types + SDK + hooks. |
| `@routesync/react` | React Query hooks factory built on `createService`. |
| `@routesync/vue` | Vue Query composables, same idea. |

---

## Install

```bash
# SDK only (manual route definitions)
npm install @routesync/sdk

# With React hooks
npm install @routesync/react @tanstack/react-query

# With Vue composables
npm install @routesync/vue @tanstack/vue-query

# CLI (route scanner + code generator)
npm install -g @routesync/cli
```

---

## Usage

### Option A — Define routes manually

Good if you don't have a Laravel backend, or want full control.

```ts
import { defineApi } from '@routesync/sdk'

export const api = defineApi(
  {
    auth: {
      login:  { method: 'POST', path: '/login' },
      logout: { method: 'POST', path: '/logout', auth: true },
    },
    products: {
      list:   { method: 'GET',  path: '/products' },
      detail: { method: 'GET',  path: '/products/:id' },
      create: { method: 'POST', path: '/products', auth: true },
    },
  },
  { baseURL: 'https://api.myapp.com/api' }
)
```

Then call it:

```ts
// GET /products?page=1&search=kaos
await api.products.list({ query: { page: 1, search: 'kaos' } })

// GET /products/42
await api.products.detail({ params: { id: 42 } })

// POST /products
await api.products.create({ body: { name: 'Kaos Polos', price: 89000 } })
```

Path params resolve automatically. `:id` → the value you pass. No string concatenation, no manual URL building.

---

### Option B — Auto-generate from Laravel

Point the CLI at your routes file and let it generate everything.

```bash
npx routesync sync \
  --input ../laravel-backend/routes/api.php \
  --output src/api \
  --baseURL https://api.myapp.com/api
```

Generated output:

```
src/api/
├── api.ts      ← typed API client
├── types.ts    ← TypeScript interfaces
└── hooks.ts    ← React Query hooks
```

To keep it in sync during development:

```bash
npx routesync watch --input routes/api.php --output src/api
```

---

### Authentication

```ts
import { createClient } from '@routesync/sdk'

const { setToken, clearToken } = createClient({
  baseURL: 'https://api.myapp.com/api'
})

// After login:
setToken(response.data.token)

// On logout:
clearToken()
```

Any route with `auth: true` in its definition automatically gets `Authorization: Bearer TOKEN` injected. You don't think about it again.

---

### React Query Hooks

```ts
import { createService } from '@routesync/sdk'
import { createHooks } from '@routesync/react'
import { z } from 'zod'

const productSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  price: z.number(),
})

const productService = createService(client, '/products', {
  entitySchema: productSchema,
  listSchema: z.array(productSchema),
})

const { useList, useDetail, useCreate } = createHooks(productService, 'products')
```

In your component:

```tsx
function ProductList() {
  const { data, isLoading } = useList({ page: 1 })
  const mutation = useCreate()

  return (
    <>
      {data?.map(p => <div key={p.id}>{p.productName}</div>)}
      <button onClick={() => mutation.mutate({ productName: 'Kaos Baru' })}>
        Add Product
      </button>
    </>
  )
}
```

Backend returns `product_name`. Your component sees `productName`. The mapper runs automatically in both directions — request payload goes snake_case before it hits the server, response comes back camelCase before it hits your component.

---

### Vue Composables

```ts
import { createVueComposables } from '@routesync/vue'

const { useList, useCreate } = createVueComposables(productService, 'products')
```

Same API, Vue-native.

---

### Resource groups

When you have multiple endpoints on the same resource, `resource()` lets you set shared defaults (auth, headers) once:

```ts
import { defineApi, resource } from '@routesync/sdk'

const api = defineApi({
  cart: resource({
    auth: true,  // applies to all endpoints below
    endpoints: {
      list:     { method: 'GET',    path: '/cart/items' },
      show:     { method: 'GET',    path: '/cart/items/:id' },
      add:      { method: 'POST',   path: '/cart/items' },
      update:   { method: 'PATCH',  path: '/cart/items/:id' },
      remove:   { method: 'DELETE', path: '/cart/items/:id' },
      checkout: { method: 'POST',   path: '/cart/checkout' },
    }
  })
}, config)
```

---

### Schema validation + custom mapping

You can attach Zod schemas to any endpoint for validation, and a mapper for custom transformations:

```ts
import { z } from 'zod'

const api = defineApi({
  products: {
    list: {
      method: 'GET',
      path: '/products',
      schema: z.array(productSchema),
      mapper: (data) => data.map(normalizeProduct),
    }
  }
}, config)
```

---

### Auto-generate TanStack hooks from defineApi

If you're using `defineApi` (instead of `createService`), you can generate hooks for the whole API at once:

```ts
import { defineApi } from '@routesync/sdk'
import { generateHooks } from '@routesync/sdk'

const api = defineApi({ products: { list: ..., create: ... } }, config)
const { useProductsList, useProductsCreate } = generateHooks(api)
```

Hook names are derived from group + action: `products.list` → `useProductsList`. GET/DELETE become `useQuery`, everything else becomes `useMutation`. Mutations auto-invalidate their group's queries on success.

---

### Multiple backends

RouteSync isn't Laravel-only. Anything with a REST API works:

```ts
const laravel = defineApi(routes, { baseURL: 'https://laravel.myapp.com/api' })
const express = defineApi(routes, { baseURL: 'https://express.myapp.com/api' })
const php     = defineApi(routes, { baseURL: 'https://php.myapp.com/api' })
```

The CLI also supports OpenAPI and native PHP alongside Laravel.

---

## CLI reference

```bash
# Scan routes → route manifest JSON
npx routesync scan --input routes/api.php

# Generate SDK from manifest
npx routesync generate --manifest routesync.json --output src/api

# Scan + generate in one step
npx routesync sync --input routes/api.php --output src/api --baseURL http://localhost/api

# Watch mode — auto-syncs on file change
npx routesync watch --input routes/api.php --output src/api
```

---

## How it works

```
Laravel routes/api.php
        ↓
   routesync sync
        ↓
  Route manifest (JSON)
        ↓  
  SDK + types + hooks
        ↓
  React / Vue / Next.js / anywhere
```

The CLI parses your route file, builds a language-agnostic manifest, then feeds it to the generators. Each generator is independent — you can swap them out or write your own on top of the manifest format.

---

## Roadmap

- [ ] OpenAPI export from the manifest
- [ ] SWR adapter alongside React Query
- [ ] Solid.js composables
- [ ] First-class Next.js Server Actions integration
- [ ] VSCode extension — IntelliSense on `api.` without importing

---

## Requirements

- Node.js >= 18

## License

MIT