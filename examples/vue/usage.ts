/**
 * Example: RouteSync with Vue 3 + Vue Query
 */

// 1. Setup main.ts
// -----------------
// import { createApp } from 'vue'
// import { VueQueryPlugin } from '@tanstack/vue-query'
// import App from './App.vue'
//
// createApp(App).use(VueQueryPlugin).mount('#app')

// 2. Define API
// -----------------
import { defineApi } from '@routesync/sdk'

export const api = defineApi(
  {
    produk: {
      list:   { method: 'GET',  path: '/produk' },
      detail: { method: 'GET',  path: '/produk/:id' }
    },
    cart: {
      addItem:    { method: 'POST',   path: '/cart/items', auth: true },
      removeItem: { method: 'DELETE', path: '/cart/items/:produkItemId', auth: true }
    },
    orders: {
      index: { method: 'GET',  path: '/orders', auth: true },
      show:  { method: 'GET',  path: '/orders/:id', auth: true }
    }
  },
  {
    baseURL: 'http://localhost:8000/api'
  }
)

// 3. Create composables
// -----------------
import { createVueComposables } from '@routesync/vue'
import { createService, createHttpClient } from '@routesync/sdk'

const { client } = createHttpClient({ baseURL: 'http://localhost:8000/api' })

const productService = createService(client, '/produk')
export const productComposables = createVueComposables(productService, 'produk')

// 4. Use in Vue component
// -----------------
// <script setup lang="ts">
// import { productComposables } from '@/api/vue'
//
// const { useList, useDetail, useCreate, useDelete } = productComposables
//
// const { data, isLoading } = useList({ page: 1 })
// const createMutation = useCreate()
//
// function addProduct() {
//   createMutation.mutate({ name: 'Produk Baru', harga: 50000 })
// }
// </script>
//
// <template>
//   <div v-if="isLoading">Loading...</div>
//   <ul v-else>
//     <li v-for="p in data?.data" :key="p.id">{{ p.name }}</li>
//   </ul>
//   <button @click="addProduct">Tambah Produk</button>
// </template>
