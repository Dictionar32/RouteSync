/**
 * Application constants
 */

export const ApiPath = {
  AUTH: {
    LOGIN: "login",
    REGISTER: "register",
    PROFILE: "profile",
    LOGOUT: "logout",
  },
}
// API Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Storage Keys
export const STORAGE_KEYS = {
  CART: 'cart-storage',
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN:          "/login",
  REGISTER:       "/register",
  LOGOUT:         "/logout",
  ME:             "/profile",

  // Password
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD:  "/reset-password",

  // Social
  SOCIAL_LOGIN:    "/social/login",
  
  // Products
  PRODUK: '/produk',
  PRODUK_DETAIL: (id: string | number) => `/produk/${id}`,
  KATEGORI: '/categories',
  
  // Cart - matched with backend routes
  CART: '/cart',
  CART_ITEMS: '/cart/items',
  CART_ITEM: (produkItemId: string | number) => `/cart/items/${produkItemId}`,
  CART_CLEAR: '/cart',
  CART_PROMO: '/cart/promo',
  
  // Orders
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
  ORDER_CREATE: '/checkout',
  BUY_NOW: '/buy-now',
  KERANJANG: '/keranjang',
  
  // Wishlist - matched with backend routes
  WISHLIST: '/wishlist',
  WISHLIST_ADD: '/wishlist',
  WISHLIST_REMOVE: (produkItemId: string | number) => `/wishlist/${produkItemId}`,
  
  // Payment - matched with backend routes
  PAYMENT: (orderId: string | number) => `/payment/${orderId}`,
  PAYMENT_WEBHOOK: '/payment/webhook',
  
  // Profile
  PROFILE: '/profile',
  PROFILE_UPDATE: '/profile',
  
  // Reviews
  REVIEWS: (produkId: string | number) => `/produk/${produkId}/reviews`,
} as const

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PRODUK: '/produk',
  PRODUK_DETAIL: (id: string | number) => `/produk/${id}`,
  KERANJANG: '/keranjang',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
  WISHLIST: '/wishlist',
  PROFILE: '/profile',
} as const

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const
