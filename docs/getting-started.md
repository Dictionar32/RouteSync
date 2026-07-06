# Getting Started

RouteSync syncs your Laravel routes and Eloquent models to a fully-typed frontend SDK — complete with TypeScript types, Zod schemas, camelCase mappers, TanStack Query hooks, and Next.js Server Actions. One command. Zero boilerplate.

---

## Prerequisites

- **Node.js**: `>= 20`
- **PHP**: `>= 8.0` (required for model scanning via Eloquent)
- **TanStack Query**: React/Vue Query (if using hooks)
- **Zod**: Required for payload validation and mapping

---

## Installation

Install the RouteSync package in your frontend project:

```bash
# If using React/Next.js:
npm install routesync @tanstack/react-query zod react-hook-form @hookform/resolvers

# If using Vue:
npm install routesync @tanstack/vue-query zod vee-validate @vee-validate/zod
```

To run the CLI commands, you can use `npx routesync` directly without global installation.

---

## Quick Start (Laravel + Next.js / React)

### Step 1: Annotate Laravel Controllers (Optional but Recommended)

In your **Laravel project root**, run the following to automatically inject PHP 8 response attributes based on your controller's JsonResource return types:

```bash
npx routesync annotate --input routes/api.php
```

This ensures RouteSync knows exactly what models are returned by which endpoints.

### Step 2: Scan and Sync to Frontend

From your **Laravel project root**, sync your routes and database models directly into your frontend directory (`src/api`):

```bash
npx routesync sync \
  --input routes/api.php \
  --output ../frontend/src/api \
  --baseURL http://localhost/api \
  --models \
  --zod \
  --next-actions
```

> [!IMPORTANT]
> **Database Connection with Docker / Local Dev:**
> Since `--models` boots your Laravel app to query table structures from the database, the CLI must be able to connect to the database. If your Laravel app is configured for Docker (e.g. `DB_HOST=mysql`), running the CLI on your host machine will fail to connect.
>
> You must override the database environment variables to point to your local machine's Docker mapping (e.g. `DB_HOST=127.0.0.1 DB_PORT=3307`):
> ```bash
> DB_HOST=127.0.0.1 DB_PORT=3307 npx routesync sync \
>   --input routes/api.php \
>   --output ../frontend/src/api \
>   --baseURL http://localhost/api \
>   --models \
>   --zod \
>   --next-actions
> ```

### Generated Folder Structure

Executing the sync command with `--zod` and `--next-actions` creates a fully-typed SDK layer:

```
src/api/
├── api.ts              # Fully-typed API client registry (defineApi)
├── hooks.ts            # TanStack Query query/mutation hooks + cache invalidation
├── actions.ts          # Next.js Server Actions (for server-side data fetching)
├── query-key.ts        # TanStack Query key factory for cache management
├── schemas.ts          # Legacy schema schemas for backward compatibility
├── index.ts            # Barrel export of the API client and hooks
├── contract/
│   ├── api-contract.ts # Zod schemas for models, resources, and payloads (snake_case)
│   ├── api-schema.ts   # ApiSchema, ApiFormValues, ApiDefaultValues (camelCase)
│   └── api-field.ts    # Backend snake_case field key constants
├── types/
│   ├── api-read.ts     # Frontend transformed read-only camelCase types (flattened)
│   ├── api-form.ts     # Frontend request body / form state types
│   └── index.ts        # Type barrel re-export
├── mappers/
│   └── api-mapper.ts   # Runtime transformation functions (camelCase ↔ snake_case)
└── core/
    └── models.ts       # Eloquent database column types represented in TypeScript
```

---

## Basic Usage

### 1. Direct API Calls (Client-Side)

Use the default exported `api` client. Response types and request payloads are automatically validated and converted to **camelCase**:

```ts
import { api } from '@/api/api'

// GET /api/produk
const products = await api.produk.list() 
// products type: ProdukItemResourceIndex (camelCase)

// GET /api/produk/10
const product = await api.produk.get({ params: { id: 10 } })

// POST /api/cart/items (with camelCase body payload)
const cart = await api.cartItems.create({
  body: {
    produkItemId: 5,
    qty: 2
  }
})
```

### 2. Next.js Server Actions

Call your backend API directly from Next.js Server Components, Server Actions, or Route Handlers using the generated server actions:

```tsx
// src/app/products/page.tsx
import { listProduk, getProduk } from '@/api/actions'

export default async function Page() {
  // Runs on the server side
  const products = await listProduk()
  
  return (
    <div>
      {products.map(p => (
        <div key={p.id}>{p.nama}</div>
      ))}
    </div>
  )
}
```

---

## Next Steps

- [CLI Generators & Output Reference](./generators.md)
- [React & Vue Hook Usage](./hooks.md)
- [Routing & Path Parameters](./routing.md)
- [Authentication](./auth.md)
