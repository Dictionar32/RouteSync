/**
 * RouteSync — endpoint-centric usage
 */
import { defineApi, endpoint, resource, generateHooks } from '@routesync/sdk'
import { useApiQuery, useApiMutation, createHooks } from '@routesync/react'

// ----------------------------------------------------------------
// 1. Define API
// ----------------------------------------------------------------
export const api = defineApi(
  {
    auth: {
      login:  endpoint({ method: 'POST', path: '/login' }),
      logout: endpoint({ method: 'POST', path: '/logout', auth: true }),
    },
    produk: {
      list:   endpoint({ method: 'GET', path: '/produk' }),
      detail: endpoint({ method: 'GET', path: '/produk/:id' }),
    },
    cart: {
      list:       endpoint({ method: 'GET',    path: '/cart/items',         auth: true }),
      addItem:    endpoint({ method: 'POST',   path: '/cart/items',         auth: true }),
      updateItem: endpoint({ method: 'PATCH',  path: '/cart/items/:itemId', auth: true }),
      removeItem: endpoint({ method: 'DELETE', path: '/cart/items/:itemId', auth: true }),
    },
    orders: {
      index:    endpoint({ method: 'GET',  path: '/orders',   auth: true }),
      checkout: endpoint({ method: 'POST', path: '/checkout', auth: true }),
    },
  },
  { baseURL: 'http://localhost:8000/api' }
)

// ----------------------------------------------------------------
// 2. Direct hook usage — endpoint passed directly, no extra args
// ----------------------------------------------------------------

// GET → useApiQuery
const { data: products, isLoading } = useApiQuery(api.produk.list)
const { data: product } = useApiQuery(api.produk.detail, { params: { id: 10 } })
const { data: cartItems } = useApiQuery(api.cart.list)

// POST/PATCH/DELETE → useApiMutation
const addItem = useApiMutation(api.cart.addItem)
addItem.mutate({ body: { produk_id: 1, qty: 2 } })

// Checkout — auto-invalidate cart + orders on success
const checkout = useApiMutation(api.orders.checkout, {
  invalidate: [api.cart.list, api.orders.index],
})
checkout.mutate({ body: { address_id: 3 } })

// ----------------------------------------------------------------
// 3. createHooks — generate hooks for a whole group
// ----------------------------------------------------------------
const cartHooks = createHooks(api.cart)

const { data: cart } = cartHooks.useList()
const addToCart = cartHooks.useAddItem()
addToCart.mutate({ body: { produk_id: 2, qty: 1 } })

// ----------------------------------------------------------------
// 4. generateHooks — generate all hooks from entire api
// ----------------------------------------------------------------
const hooks = generateHooks(api)

const { data: orderList } = hooks.useOrdersIndex()
const checkoutMutation = hooks.useOrdersCheckout()

// ----------------------------------------------------------------
// 5. resource() — grouping with shared defaults
// ----------------------------------------------------------------
export const wishlist = resource({
  auth: true,
  endpoints: {
    index:   { method: 'GET',    path: '/wishlist' },
    store:   { method: 'POST',   path: '/wishlist' },
    destroy: { method: 'DELETE', path: '/wishlist/:itemId' },
  },
})