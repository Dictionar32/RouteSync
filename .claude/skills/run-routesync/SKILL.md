---
name: run-routesync
description: Build, test, and run RouteSync against the toko-online Laravel project — scan routes, generate typed SDK, validate output including FormValues
---

All paths below are relative to the repo root unless stated otherwise.

## What this is

RouteSync is a Node.js CLI + library that syncs Laravel routes to a
fully-typed TypeScript frontend SDK. The **driver**
`.claude/skills/run-routesync/driver.mjs` connects to the real
`C:\Users\User\toko-online` Laravel project: it scans routes via PHP,
generates the SDK into the Next.js frontend, runs the test suite, and
validates library exports.

## Generated output (what `--zod` produces)

With the `--zod` flag, the `ZodTierGenerator` produces a full type-safe
layer across 4 directories:

```
frontend/src/api/
├── api.ts                   ← typed API client (defineApi + endpoint contracts)
├── hooks.ts                 ← React Query hooks + Eloquent cache invalidation
├── actions.ts               ← Next.js Server Actions
├── index.ts                 ← barrel re-export
├── query-key.ts             ← TanStack QueryKey factory
├── schemas.ts               ← legacy Zod schemas
├── contract/
│   ├── api-contract.ts      ← Zod schemas for models, resources, route responses, payloads
│   ├── api-schema.ts        ← ApiSchema + ApiFormValues + ApiDefaultValues
│   └── api-field.ts         ← ApiApiField constants (snake_case backend keys)
├── types/
│   ├── api-read.ts          ← camelCase transformed types (flatten strategy)
│   ├── api-form.ts          ← input/request body types
│   └── index.ts             ← re-exports
├── mappers/
│   └── api-mapper.ts        ← contract↔read transformation functions
└── core/
    └── models.ts            ← Eloquent DB model types
```

### FormValues (api-schema.ts)

`ApiFormValues` and `ApiDefaultValues` are auto-generated from Laravel
`FormRequest` validation rules. Every route with a typed `FormRequest`
parameter gets a Zod schema, a type-safe form state type, and a
ready-to-use empty default value:

```ts
// Generated:
export const ApiSchema = {
  CheckoutCreate: z.object({ items: z.array(...), shippingNama: z.string()... }),
  AdminProdukCreate: z.object({ nama: z.string(), harga: z.number(), ... }),
  // ... 15 form schemas in toko-online
}

export type ApiFormValues = {
  CheckoutCreate:    z.infer<typeof ApiSchema.CheckoutCreate>
  AdminProdukCreate: z.infer<typeof ApiSchema.AdminProdukCreate>
  // ...
}

export const ApiDefaultValues = {
  checkoutCreate:    {} as ApiFormValues['CheckoutCreate'],
  adminProdukCreate: {} as ApiFormValues['AdminProdukCreate'],
  // ...
}
```

Usage in React:
```tsx
import { ApiFormValues, ApiDefaultValues } from '@/api/contract/api-schema'
import { toApiCheckoutCreate } from '@/api/mappers/api-mapper'

const [form, setForm] = useState<ApiFormValues['CheckoutCreate']>(ApiDefaultValues.checkoutCreate)
// mapper auto-transforms camelCase → snake_case for the API contract
const payload = toApiCheckoutCreate(form)
```

### Generator mapping — existing vs new files

The Zod tier is **pure additive** — no existing generator output was
changed or removed. `FormValues` adds 5 new files across `contract/`,
`types/`, `mappers/` while all original files continue to generate as
before.

**Files untouched (original generators):**

| File | Generator |
|------|-----------|
| `api.ts` | SDKGenerator |
| `hooks.ts` | HookGenerator (+ Eloquent cache invalidation) |
| `actions.ts` | NextActionGenerator |
| `index.ts` | IndexGenerator |
| `query-key.ts` | QueryKeyGenerator |
| `schemas.ts` | SchemaGenerator (legacy, 301 lines) |

**Files added by ZodTierGenerator (with `--zod`):**

| File | Generator method |
|------|-----------------|
| `contract/api-contract.ts` | `generateContract()` — Zod schemas for models, resources, route responses, payloads |
| `contract/api-schema.ts` | `generateSchema()` — `ApiSchema` + `ApiFormValues` + `ApiDefaultValues` |
| `contract/api-field.ts` | `generateField()` — `ApiApiField` snake_case key constants |
| `types/api-read.ts` | `generateRead()` — camelCase transformed types with flatten |
| `types/api-form.ts` | `generateForm()` — input request body types |
| `types/index.ts` | `generateRead()` — re-exports |
| `mappers/api-mapper.ts` | `generateMapper()` — contract↔read transformation functions |
| `core/models.ts` | ModelGenerator — Eloquent DB model types |

> **Note:** `schemas.ts` (legacy SchemaGenerator) still coexists with
> `contract/api-schema.ts`. It can be deprecated once the new Zod tier
> fully covers all validation needs.

### Generated file patterns

Each generated file follows a consistent template. These are the actual
patterns from toko-online (35 routes, 20 models).

#### `api.ts` — typed API client

```ts
// Constants block
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
export const API_ENDPOINTS = {
  PRODUK: '/produk',
  PRODUK_DETAIL: (id: string | number) => `/produk/${id}`,
  // ... per path
} as const

export const ROUTES = {
  HOME: '/',
  PRODUK: '/produk',
  // ...
} as const

// Enum constants from DB columns
export const ORDER_STATUS = { PENDING: 'pending', PAID: 'paid', CANCELED: 'canceled' } as const
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS]

// Endpoint registry
export const api = defineApi({
  produk: {
    list: endpoint({ method: 'GET', path: API_ENDPOINTS.PRODUK,
      contract: { response: validateProdukListResponse },
      mapper:   { response: toProdukItemResourceReadList },
    }),
    get:  endpoint({ method: 'GET', path: API_ENDPOINTS.PRODUK_DETAIL, ... }),
  },
  cartItems: {
    create: endpoint({ method: 'POST', path: API_ENDPOINTS.CART_ITEMS, auth: true,
      contract: { body: validateCartItemsCreatePayload, response: validateOrderResource },
      mapper:   { response: toOrderResourceRead, body: toApiCartItemsCreate },
    }),
    // ...
  },
  // ... 20 resource groups in toko-online
})
```

#### `hooks.ts` — React Query hooks + cache

```ts
import { defineHooks } from 'routesync/react'
import { api } from './api'
import { QueryKey } from './query-key'

export const hooks = defineHooks({
  produk: {
    types: {
      list:   typeOf<ProdukItemResourceIndex>(),
      detail: typeOf<ProdukItemResourceShow>(),
      create: typeOf<never>(),
      update: typeOf<never>(),
    },
    queryKey: QueryKey.produk,
    actionKeys: {
      list: QueryKey.produk.list,
      get:  QueryKey.produk.get,
    },
    endpoint: api.produk,
    cache: {
      list:   QueryKey.produk.lists,
      detail: QueryKey.produk.detail,
    },
  },
  cartItems: {
    // ...
    cache: {
      create: { invalidate: [QueryKey.orders.lists, QueryKey.keranjang.list] },
      remove: { invalidate: [QueryKey.orders.lists, QueryKey.keranjang.list] },
    },
  },
  payment: {
    // Eloquent belongsTo: Payment → Order
    cache: {
      post: { invalidate: [QueryKey.orders.lists, QueryKey.orders.detail] },
    },
  },
  logout: {
    cache: {
      create: { invalidate: [
        QueryKey.profile.list, QueryKey.orders.lists,
        QueryKey.keranjang.list, QueryKey.wishlist.list,
      ]},
    },
  },
})

export const useProduk = hooks.produk
export const useCartItems = hooks.cartItems
// ... per resource
```

#### `contract/api-contract.ts` — Zod validators (3 categories)

```ts
import { z } from 'zod'

// 1. Model schemas (from DB columns + casts + accessors)
export const ProdukItemSchema = z.object({
  id: z.number(),
  nama: z.string(),
  harga: z.number(),
  createdAt: z.string().nullable(),
  // ... all columns in camelCase
})
export type ProdukItemApiResponse = z.infer<typeof ProdukItemSchema>

// 2. Resource schemas (from JsonResource toArray)
export const OrderResourceSchema = z.object({
  id: z.number(),
  orderNumber: z.string().nullable(),
  status: z.union([z.literal('pending'), z.literal('paid'), z.literal('canceled')]),
  // nested: user, details, payment, shipping...
})
export type OrderResourceResponse = z.infer<typeof OrderResourceSchema>

// 3. Route payload + response validators
export const CheckoutCreatePayloadSchema = z.object({
  items: z.array(z.object({ produkItemId: z.string(), qty: z.number() })).optional(),
  shippingNama: z.string().optional().nullable(),
  // ... from FormRequest rules
})
export const validateCheckoutCreatePayload = (payload: unknown) =>
  CheckoutCreatePayloadSchema.parse(payload)
```

#### `contract/api-schema.ts` — FormState types

```ts
export const ApiSchema = {
  RegisterCreate:      z.object({ name: z.string(), email: z.string(), password: z.string() }),
  CheckoutCreate:      z.object({ items: z.array(...), shippingNama: z.string()... }),
  AdminProdukCreate:   z.object({ nama: z.string(), harga: z.number(), ... }),
  // 15 schemas in toko-online
}

export type ApiFormValues = {
  RegisterCreate:      z.infer<typeof ApiSchema.RegisterCreate>
  CheckoutCreate:      z.infer<typeof ApiSchema.CheckoutCreate>
  // ...
}

export const ApiDefaultValues = {
  registerCreate:      {} as ApiFormValues['RegisterCreate'],
  checkoutCreate:      {} as ApiFormValues['CheckoutCreate'],
  // ... camelCase keys
}
```

#### `contract/api-field.ts` — backend key constants

```ts
export const ApiApiField = {
  NAMA: "nama", EMAIL: "email", PRODUK_ITEM_ID: "produk_item_id",
  SHIPPING_ALAMAT: "shipping_alamat", SHIPPING_KODE_POS: "shipping_kode_pos",
  // ... all form fields in UPPER_SNAKE → snake_case
} as const
```

#### `types/api-read.ts` — camelCase transformed types

```ts
// DB Model → Transformed (columns + appends, camelCased)
export interface ProdukItemTransformed {
  id: number; nama: string; harga: number; createdAt: string | null
}
export type ProdukItemShow = ProdukItemTransformed
export type ProdukItemIndex = ProdukItemTransformed[]

// Resource → Transformed (flattened nested fields)
export interface OrderResourceTransformed {
  id: number; orderNumber: string | null; status: "pending" | "paid" | "canceled"
  // Flattened: user.name → userName, payment.status → paymentStatus
  userId: number; userName: string | null
  paymentStatus: string | null; shippingAlamat: string | null
}
export type OrderResourceShow = OrderResourceTransformed
export type OrderResourceIndex = OrderResourceTransformed[]

// Object response → Transformed (GET-only, flattened)
export interface CategoriesTransformed {
  categoriesId: number; categoriesNama: string
}
```

#### `types/api-form.ts` — request body types

```ts
// One Form type per resource, with CRUD action keys
export type ProdukReviewsForm = {
  Create: { rating: number; title?: string; comment?: string }
}

export type CheckoutForm = {
  Create: {
    items?: Array<{ produkItemId: string; qty: number }>
    shippingNama?: string; shippingAlamat?: string
  }
}

export type AdminProdukForm = {
  Create: {
    nama: string; deskripsi?: string; harga: number; stok: number
    categoryId: string
  }
}
```

#### `mappers/api-mapper.ts` — transformation functions

```ts
// 1. DB Model mappers (snake_case API response → camelCase Transformed)
export const toProdukItemRead = (api: ProdukItemApiResponse): ProdukItemTransformed => ({
  id: api.id, nama: api.nama, harga: api.harga, createdAt: api.created_at,
})
export const toProdukItemReadList = (api: ProdukItemApiResponse[]): ProdukItemTransformed[] =>
  api.map(toProdukItemRead)

// 2. Resource mappers (nested → flattened)
export const toOrderResourceRead = (api: OrderResourceResponse): OrderResourceTransformed => ({
  id: api.id, orderNumber: api.order_number, status: api.status,
  userId: api.user?.id, userName: api.user?.name,              // flatten user.*
  paymentStatus: api.payment?.status,                           // flatten payment.status
  // ...
})

// 3. Route response mappers
export const toCheckoutResponseRead = (api: CheckoutResponse): CheckoutTransformed => ({...})

// 4. Form → Payload mappers (camelCase → snake_case for API)
export const toApiCheckoutCreate = (form: ApiFormValues['CheckoutCreate']): CheckoutCreatePayload => ({
  [ApiApiField.SHIPPING_NAMA]: form.shippingNama,
  [ApiApiField.SHIPPING_ALAMAT]: form.shippingAlamat,
  // ... using ApiApiField constants
})
```

### Flatten strategy (api-read.ts)

Nested resource/model responses are flattened with prefix naming:
- `produk.id` → `produkId`
- `reviews.data` → `reviewsData`, `reviews.current_page` → `reviewsCurrentPage`
- All field names are camelCased from snake_case DB columns

### Eloquent cache invalidation (hooks.ts)

The HookGenerator traverses Eloquent model relations (belongsTo,
hasOne, hasMany) from the scanned manifest to auto-generate
cross-resource cache invalidation rules. See
`packages/cli/src/generators/HookGenerator.ts` — strategy 5.

## Prerequisites

```bash
# Node.js >= 20
node -v

# PHP >= 8.0 on PATH (for scan --models)
php -v
```

## Build

```bash
npm install
npm run build      # tsup → dist/ (CJS + ESM for each package)
```

## Run (agent path) — the driver

```bash
# From the repo root:
node .claude/skills/run-routesync/driver.mjs
```

The driver runs these steps:

1. **Build routesync** (`npx tsup`) — skip with `--skip-build`
2. **Test suite** (`npx vitest run`) — skip with `--skip-test`
3. **Scan toko-online** (`routesync scan --models`) — reads
   `C:\Users\User\toko-online\routes\api.php` + 20 Eloquent models via PHP,
   outputs `routesync.manifest.json`. Skip with `--skip-scan`
4. **Generate SDK** — `routesync generate` from the manifest into
   `C:\Users\User\toko-online\frontend\src\api\` with `--next-actions`
   and `--zod`. Verifies all 14 generated files:
   - Core: `api.ts`, `hooks.ts`, `actions.ts`, `index.ts`, `query-key.ts`
   - Contract tier: `contract/api-contract.ts`, `contract/api-schema.ts`
     (with `ApiFormValues` + `ApiDefaultValues`), `contract/api-field.ts`
   - Types: `types/api-read.ts`, `types/api-form.ts`, `types/index.ts`
   - Mappers: `mappers/api-mapper.ts`
   - Models: `core/models.ts`
   - Checks for real toko-online endpoints (produk, login, register, cart,
     orders, wishlist, checkout)
5. **CLI help/version** — verifies `--help` and `--version`
6. **Library imports** — `require()`s the SDK CJS bundle, exercises
   `defineApi()`, `endpoint()`, `toCamelCase()`, `toSnakeCase()`

### Options

| Flag | Effect |
|------|--------|
| `--skip-build` | Skip tsup (use when dist/ is current) |
| `--skip-test`  | Skip vitest |
| `--skip-scan`  | Skip Laravel scan (use existing manifest) |
| `--smoke-only` | Library + help/version only |

### Configuring paths

Edit the constants at the top of `driver.mjs`:

```js
const TOKO_ONLINE = 'C:\\Users\\User\\toko-online'
const TOKO_ROUTES = 'routes/api.php'
const TOKO_OUTPUT = 'frontend/src/api'
const TOKO_BASE_URL = 'http://localhost:8000/api'
```

## Run (human path)

```bash
# 1. In the toko-online Laravel project:
cd C:\Users\User\toko-online
node ..\..\routesync\dist\cli.js annotate --input routes/api.php --dry-run
node ..\..\routesync\dist\cli.js scan --input routes/api.php --models --baseURL http://localhost:8000/api

# 2. In the toko-online frontend:
node ..\..\routesync\dist\cli.js generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod
```

## Direct invocation (library)

```js
// ESM
import { defineApi, endpoint, toCamelCase } from './dist/sdk.mjs'

// CJS
const { defineApi, endpoint, toCamelCase } = require('./dist/sdk.js')

const api = defineApi({
  produk: { list: endpoint({ method: 'GET', path: '/produk' }) },
})
console.log(toCamelCase({ user_name: 'x' }).userName) // → 'x'
```

## Test

```bash
npm test
npx vitest run     # equivalent
```

3 tests across 2 files:
- `packages/sdk/tests/queryKey.spec.ts`
- `packages/sdk/tests/constants.spec.ts`
- `packages/react/tests/type-inference/type-audit.type-spec.ts`

## Gotchas

- **`generate` says `types.ts` but writes `types/`**: The status line prints
  `types.ts` for readability, but actual files are `types/api-read.ts`,
  `types/api-form.ts`, `types/index.ts`. The flat `types.ts` does **not** exist.
- **`hooks.ts` uses `defineHooks`, not `useApiQuery`**: The generated file
  exports per-resource hooks (`useProduk`, `useCartItems`, etc.) built on
  the `defineHooks` registry. `useApiQuery` is deprecated but still importable.
- **`mapKeysDeep` takes string, not function**: `mapKeysDeep(obj, 'camel')`
  or `mapKeysDeep(obj, 'snake')`. Prefer `toCamelCase()`/`toSnakeCase()`.
- **`scan --models` requires PHP + database**: The scanner runs a temporary PHP
  script via Laravel's bootstrap. Routes alone scan fine without `--models`.
- **PowerShell backslash**: `\` is a parser error. Use single-line commands.
- **`schemas.ts` is legacy**: It coexists with the newer `contract/api-schema.ts`.
  The ZodTierGenerator writes to `contract/`, `types/`, `mappers/`. Old
  `schemas.ts` is still generated by SchemaGenerator for backward compat.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot find module '...dist/cli.js'` | Run `npm run build` |
| `Manifest not found` | Run `routesync scan` first, or pass absolute path |
| `vitest: command not found` | Run `npm install` |
| `scan` shows "Response type could not be inferred" | Expected for endpoints without JsonResource. Annotate with `#[Response]`. |
| `php: command not found` | Install PHP >= 8.0 and add to PATH |
| `ApiFormValues` not in generated output | Pass `--zod` flag to `routesync generate` |
