# Routing & Path Params

## Defining Routes

Each endpoint is defined with `method`, `path`, and optional `auth`:

```ts
{
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: '/your/path',
  auth: true // optional, injects Bearer token automatically
}
```

---

## Path Parameters

Use `:paramName` in the path, then pass `params` when calling:

```ts
const api = defineApi({
  produk: {
    detail:  { method: 'GET',    path: '/produk/:id' },
    reviews: { method: 'GET',    path: '/produk/:id/reviews' },
    delete:  { method: 'DELETE', path: '/produk/:id', auth: true }
  }
})

// Usage:
await api.produk.detail({ params: { id: 10 } })
// → GET /produk/10

await api.produk.reviews({ params: { id: 10 } })
// → GET /produk/10/reviews

await api.produk.delete({ params: { id: 10 } })
// → DELETE /produk/10
```

---

## Query Parameters

Pass query strings via the `query` option:

```ts
await api.produk.list({
  query: { page: 1, limit: 10, search: 'kaos' }
})
// → GET /produk?page=1&limit=10&search=kaos
```

---

## Request Body

Pass payload via the `body` option:

```ts
await api.cart.addItem({
  body: { produk_id: 1, qty: 2 }
})
// → POST /cart/items  { produk_id: 1, qty: 2 }
```

---

## Combined Example

```ts
await api.orders.update({
  params: { id: 55 },
  body: { status: 'shipped' },
  query: { notify: true }
})
// → PUT /orders/55?notify=true  { status: 'shipped' }
```

---

## PathResolver (internal)

Internally uses `PathResolver.resolve()`:

```ts
PathResolver.resolve('/produk/:id/reviews', { id: 10 })
// → '/produk/10/reviews'
```

Throws if a param is missing:

```ts
PathResolver.resolve('/produk/:id', {})
// Error: Unresolved path params: :id
```
