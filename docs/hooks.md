# React Query Hooks & Cache Invalidation

RouteSync CLI automatically generates type-safe TanStack Query (React Query) hooks mapped to your Laravel controllers. It also analyzes Eloquent relations to auto-generate cache invalidation rules.

---

## Setup

First, wrap your application in the TanStack `QueryClientProvider` as usual:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

---

## Using Generated Hooks

In `src/api/hooks.ts`, hooks are exported per-resource group (e.g. `useRegister`, `useLogin`, `useProduk`, `useCartItems`).

Each resource hook group provides standard CRUD hooks as well as actions derived from your custom controller endpoints:

| CRUD Slot | Action Hook | Shorthand Alias | Parameter | Return Type |
|---|---|---|---|---|
| `list` | `useIndex()` | `index()` | *None* | `UseQueryResult` |
| `show` | `useShow(id)` | `show(id)` | `id: number` | `UseQueryResult` |
| `create` | `useCreate()` | `create()` | *None* | `UseMutationResult` |
| `update` | `useUpdate()` | `update()` | *None* | `UseMutationResult` |
| `delete` | `useRemove()` / `useDelete()` | `remove()` / `delete()` | *None* | `UseMutationResult` |

### 1. Fetching Lists (`useIndex` / `index`)

Retrieves the list of models. This is parameterless and automatically binds to the `list` endpoint:

```tsx
import { useProduk } from '@/api/hooks'

function ProductList() {
  const { data, isLoading } = useProduk.useIndex() // atau useProduk.index()

  if (isLoading) return <p>Loading...</p>

  return (
    <div>
      {data?.map(produk => (
        <div key={produk.id}>{produk.nama} - Rp{produk.harga}</div>
      ))}
    </div>
  )
}
```

### 2. Fetching Details (`useShow` / `show`)

Fetches a single model instance based on the path parameter:

```tsx
import { useProduk } from '@/api/hooks'

function ProductDetail({ productId }: { productId: number }) {
  const { data, error } = useProduk.useShow(productId) // atau useProduk.show(productId)

  if (!data) return <p>Product not found.</p>

  return (
    <div>
      <h1>{data.nama}</h1>
      <p>{data.deskripsi}</p>
    </div>
  )
}
```

### 3. Mutating Data (`useCreate` / `useUpdate` / `useRemove`)

Mutation hooks execute writing operations (`POST`, `PUT`, `PATCH`, `DELETE`) and trigger cache invalidation.

- `useCreate()` mutates with form body data:
  ```ts
  const create = useCartItems.useCreate()
  create.mutate({ produkItemId: 5, qty: 1 })
  ```

- `useUpdate()` mutates with an object containing `id` and `data`:
  ```ts
  const update = useCartItems.useUpdate()
  update.mutate({ id: 12, data: { qty: 3 } })
  ```

- `useRemove()` mutates with a number `id`:
  ```ts
  const remove = useCartItems.useRemove()
  remove.mutate(5)
  ```

---

## Eloquent Cache Invalidation

RouteSync hooks automatically invalidate related query caches based on Eloquent database relationships defined on your Laravel models.

For example, when database schemas are extracted (`--models` flag):
1. **Adding/removing cart items** (`useCartItems.useCreate()`) automatically invalidates:
   - `QueryKey.orders.lists` (since cart changes affect orders)
   - `QueryKey.keranjang.list` (updates shopping cart)
2. **Posting a payment** (`usePayment.useCreate()`) automatically invalidates:
   - `QueryKey.orders.lists`
   - `QueryKey.orders.detail` (since payment alters order status)
3. **Logging out** (`useLogout.useCreate()`) automatically invalidates:
   - `QueryKey.profile.list`
   - `QueryKey.orders.lists`
   - `QueryKey.keranjang.list`
   - `QueryKey.wishlist.list`

This happens completely transparently without the need to write manual TanStack `queryClient.invalidateQueries` calls on the frontend.
