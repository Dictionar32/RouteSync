# CLI Generators & Output Reference

The RouteSync CLI automates the scanning of Laravel routes/models and the generation of typed SDK files for your frontend.

---

## Installation

```bash
npm install -g @routesync/cli
```

---

## Commands Reference

### 1. `routesync annotate`
Auto-injects `#[Response]` PHP 8 attributes into Laravel controllers by parsing `return new XxxResource(...)` expressions.

```bash
routesync annotate [projectDir] --input routes/api.php [options]
```
- `--input <path>`: Path to routes file (default: `routes/api.php`).
- `--dry-run`: Preview changes in terminal without writing files.
- `--force`: Force re-annotation of methods that already have `#[Response]`.

---

### 2. `routesync scan`
Scans Laravel routes and optionally extracts Database Schemas via Eloquent Models into a JSON manifest.

```bash
routesync scan [projectDir] --input routes/api.php --output routesync.manifest.json --models
```
- `-i, --input <path>`: Path to routes file (default: `routes/api.php`).
- `-o, --output <path>`: Path to save the manifest (default: `routesync.manifest.json`).
- `-b, --baseURL <url>`: Base URL of the API (default: `http://localhost/api`).
- `--models`: Extract database column types and relationships from Eloquent models.

> [!IMPORTANT]
> **Database Connection with Docker:**
> Since `scan --models` boots your Laravel app to query table structures from your database, PHP must be able to connect to the database. If your Laravel project is configured for Docker (e.g., `DB_HOST=mysql`), running the scanner on your host machine will fail to connect.
>
> You must pass the host machine database overrides when running the command:
> ```bash
> DB_HOST=127.0.0.1 DB_PORT=3307 routesync scan --models
> ```

---

### 3. `routesync generate`
Generates the typed frontend SDK, types, and hooks from an existing manifest.

```bash
routesync generate --manifest routesync.manifest.json --output src/api [options]
```
- `-m, --manifest <path>`: Path to manifest JSON.
- `-o, --output <path>`: Output directory (default: `src/api`).
- `--no-hooks`: Skip generating query/mutation hooks.
- `--next-actions`: Generate Next.js Server Actions.
- `--msw`: Generate MSW Mock Handlers.
- `--echo`: Generate Laravel Echo hooks.
- `--zod`: Generate the full Zod validation and camelCase mapper tier (highly recommended).

---

### 4. `routesync sync`
Combines `scan` and `generate` into a single operation.

```bash
routesync sync --input routes/api.php --output src/api --models --zod --next-actions
```
*(Accepts all options from `scan` and `generate`)*

> [!IMPORTANT]
> Override database parameters if Laravel runs inside Docker:
> ```bash
> DB_HOST=127.0.0.1 DB_PORT=3307 routesync sync --models --zod --next-actions
> ```

---

### 5. `routesync watch`
Watches your Laravel routes file and triggers a `sync` automatically on changes.

```bash
routesync watch --input routes/api.php --output src/api --baseURL http://localhost/api
```

---

### 6. `routesync explain`
Explains the type resolution trace chain and confidence score for a specific field path in the manifest.

```bash
routesync explain <fieldPath> --graph routesync.graph.json
```
Example: `routesync explain login.post.data.user.role`

---

### 7. `routesync audit`
Audits the manifest graph for unresolved fields or missing resolvers.

```bash
routesync audit --graph routesync.graph.json [--verbose]
```

---

## Detailed Generated Output

When running RouteSync with the `--zod` and `--models` flags, the generator outputs files grouped into logical directories:

### 1. `contract/api-contract.ts`
Contains Zod validators for:
- Database Eloquent models (in `snake_case` reflecting DB fields).
- Laravel resource classes (`XxxResource`).
- Request payloads and route response structures.

Example:
```ts
export const ProdukItemSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string().nullable(),
  category_id: z.number().nullable(),
  harga: z.number(),
  stok: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  image: z.string().optional(), // appended
  image_url: z.string().optional(), // appended
  category_name: z.string().optional(), // appended
  rating: z.number().optional(), // appended
  review_count: z.number().optional(), // appended
})

export type ProdukItemApiResponse = z.infer<typeof ProdukItemSchema>
export const validateProdukItem = (payload: unknown): ProdukItemApiResponse => ProdukItemSchema.parse(payload)
```

### 2. `contract/api-schema.ts`
Exports `ApiSchema`, `ApiFormValues`, and `ApiDefaultValues` for frontend form validation and state management.

```ts
export const ApiSchema = {
  CheckoutCreate: z.object({
    items: z.array(z.object({
      produkItemId: z.string(),
      qty: z.number(),
    })).optional(),
    shippingNama: z.string().optional().nullable(),
    shippingTelepon: z.string().optional().nullable(),
    shippingAlamat: z.string().optional().nullable(),
    shippingKota: z.string().optional().nullable(),
    shippingKodePos: z.string().optional().nullable(),
  })
}

export type ApiFormValues = {
  CheckoutCreate: z.infer<typeof ApiSchema.CheckoutCreate>
}

export const ApiDefaultValues = {
  checkoutCreate: {} as ApiFormValues['CheckoutCreate']
}

export type ApiFormIndex = keyof ApiFormValues
export type ApiFormErrors<T extends ApiFormIndex> = Partial<Record<keyof ApiFormValues[T], string>>
```

### 3. `types/api-read.ts`
Defines the final, cleaned frontend types. Fields are converted to `camelCase`. 
Nested relationships returned by Resources are **flattened** using prefix naming for a cleaner frontend developer experience:
- `user.name` → `userName`
- `payment.status` → `paymentStatus`

```ts
export interface OrderResourceTransformed {
  id: number
  status: string
  totalHarga: number
  invoiceNumber: string | null
  paymentStatus: string
  financialStatus: string
  fulfillmentStatus: string
  subtotalMinor: number
  discountMinor: number
  shippingMinor: number
  taxMinor: number
  totalHargaMinor: number
  items?: OrderDetailResourceTransformed[]
  promotionCode: string
  promotionDiscountMinor: number
  shippingNama: string | null
  shippingTelepon: string | null
  shippingAlamat: string | null
  shippingKota: string | null
  shippingKodePos: string | null
  createdAt: string
}
export type OrderResourceShow = OrderResourceTransformed
export type OrderResourceIndex = OrderResourceTransformed[]
```

### 4. `mappers/api-mapper.ts`
Provides runtime conversion functions to map between snake_case backend payloads and camelCase frontend state.
- **Form-to-payload mapper**: Converts `ApiFormValues` to backend contract payloads.
- **Read mapper**: Converts raw backend JSON to camelCase transformed frontend reader types.

---

## Usage in Forms (FormValues & Server Validation)

RouteSync provides a `useApiForm` hook (available for React and Vue) that integrates React Hook Form/Vee-validate, Zod validation, and backend error handling automatically.

### React / Next.js Example

```tsx
import { useApiForm } from 'routesync/react'
import { ApiSchema, ApiDefaultValues } from '@/api/contract/api-schema'
import { api } from '@/api/api'

export default function CheckoutForm() {
  const { form, handleSubmit, isSubmitting } = useApiForm({
    schema: ApiSchema.CheckoutCreate,
    defaultValues: ApiDefaultValues.checkoutCreate,
    mutation: api.checkout.create,
    onSubmitSuccess: (order) => {
      alert(`Order success!`)
    },
    onSubmitError: (error) => {
      // 422 Laravel errors are automatically injected to form fields (e.g. shippingNama)
      console.error(error.message)
    }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Shipping Name</label>
        <input 
          {...form.register('shippingNama')} 
          className="border p-2 w-full"
        />
        {form.formState.errors.shippingNama && (
          <p className="text-red-500">{form.formState.errors.shippingNama.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn">
        {isSubmitting ? 'Processing...' : 'Place Order'}
      </button>
    </form>
  )
}
```

### Vue Example

```html
<script setup lang="ts">
import { useApiForm } from 'routesync/vue'
import { ApiSchema, ApiDefaultValues } from '@/api/contract/api-schema'
import { api } from '@/api/api'

const { values, errors, handleSubmit, isSubmitting } = useApiForm({
  schema: ApiSchema.CheckoutCreate,
  initialValues: ApiDefaultValues.checkoutCreate,
  mutation: api.checkout.create,
  onSuccess: (order) => {
    alert(`Order success!`)
  }
})
</script>

<template>
  <form @submit="handleSubmit">
    <input v-model="values.shippingNama" name="shippingNama" />
    <span v-if="errors.shippingNama" class="error">{{ errors.shippingNama }}</span>
    
    <button type="submit" :disabled="isSubmitting">Checkout</button>
  </form>
</template>
```
