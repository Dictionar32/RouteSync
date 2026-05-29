/**
 * Example: Using RouteSync in a React/Next.js app
 * after running: npx routesync sync
 */

import { defineApi } from '@routesync/sdk'

// Option 1: Manual defineApi (without CLI)
export const api = defineApi(
  {
    auth: {
      register: { method: 'POST', path: '/register' },
      login: { method: 'POST', path: '/login' },
      logout: { method: 'POST', path: '/logout', auth: true }
    },

    produk: {
      list: { method: 'GET', path: '/produk' },
      detail: { method: 'GET', path: '/produk/:id' },
      reviews: { method: 'GET', path: '/produk/:id/reviews' },
      createReview: { method: 'POST', path: '/produk/:id/reviews', auth: true }
    },

    cart: {
      addItem: { method: 'POST', path: '/cart/items', auth: true },
      updateItem: { method: 'PATCH', path: '/cart/items/:produkItemId', auth: true },
      removeItem: { method: 'DELETE', path: '/cart/items/:produkItemId', auth: true },
      clear: { method: 'DELETE', path: '/cart', auth: true }
    },

    orders: {
      index: { method: 'GET', path: '/orders', auth: true },
      show: { method: 'GET', path: '/orders/:id', auth: true },
      checkout: { method: 'POST', path: '/checkout', auth: true }
    },

    wishlist: {
      index: { method: 'GET', path: '/wishlist', auth: true },
      store: { method: 'POST', path: '/wishlist', auth: true },
      destroy: { method: 'DELETE', path: '/wishlist/:produkItemId', auth: true }
    }
  },
  {
    baseURL: 'http://localhost:8000/api'
  }
)

// Usage examples:

async function examples() {
  // Login
  const loginResult = await api.auth.login({
    body: { email: 'user@example.com', password: 'secret' }
  })

  // Get product list with query params
  const products = await api.produk.list({
    query: { page: 1, limit: 10, search: 'kaos' }
  })

  // Get product detail (path param)
  const product = await api.produk.detail({
    params: { id: 10 }
  })

  // Add to cart
  const cartResult = await api.cart.addItem({
    body: { produk_id: 1, qty: 2 }
  })

  // Remove from cart
  await api.cart.removeItem({
    params: { produkItemId: 5 }
  })
}
