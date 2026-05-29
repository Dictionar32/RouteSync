# React & Vue Hooks

## React

### Install

```bash
npm install @routesync/react @tanstack/react-query
```

### Setup QueryClient

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
    </QueryClientProvider>
  )
}
```

### createHooks Factory

```ts
import { createHooks } from '@routesync/react'
import { createService } from '@routesync/sdk'
import { httpClient } from './client'

const productService = createService(httpClient, '/produk')
export const productHooks = createHooks(productService, 'produk')
```

### Use in components

```tsx
import { productHooks } from '@/api/hooks'

function ProductList() {
  const { data, isLoading } = productHooks.useList({ page: 1 })
  const create = productHooks.useCreate()
  const remove = productHooks.useDelete()

  if (isLoading) return <p>Loading...</p>

  return (
    <ul>
      {data?.data?.map(p => (
        <li key={p.id}>
          {p.name}
          <button onClick={() => remove.mutate(p.id)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}
```

### Auto-generated hooks (via CLI)

After running `npx routesync sync`, use auto-generated hooks:

```ts
// Auto-generated: src/api/hooks.ts
import { useProdukList, useProdukDetail, useCreateCart } from '@/api/hooks'

const { data } = useProdukList({ page: 1 })
const mutation = useCreateCart()
```

---

## Vue

### Install

```bash
npm install @routesync/vue @tanstack/vue-query
```

### Setup VueQuery

```ts
// main.ts
import { VueQueryPlugin } from '@tanstack/vue-query'

app.use(VueQueryPlugin)
```

### Use composables

```ts
import { createVueComposables } from '@routesync/vue'
import { createService } from '@routesync/sdk'

const productService = createService(httpClient, '/produk')
const { useList, useCreate } = createVueComposables(productService, 'produk')

// In setup():
const { data, isLoading } = useList({ page: 1 })
const mutation = useCreate()
```
