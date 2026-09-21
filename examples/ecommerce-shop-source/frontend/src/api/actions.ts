// Auto-generated Next.js Server Actions. Do not edit manually.
"use server";

import { api } from './api'
import { cookies } from 'next/headers'

// Helper to auto-inject token from cookies if available
async function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token ? { Authorization: `Bearer ${token}` } : undefined
}

export async function registerCreateAction(payload: Parameters<typeof api.register.create>[0]) {
  try {
    const data = await api.register.create({ body: payload.body })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function loginCreateAction(payload: Parameters<typeof api.login.create>[0]) {
  try {
    const data = await api.login.create({ body: payload.body })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function oauthRedirectGetAction(payload: Parameters<typeof api.oauthRedirect.get>[0]) {
  try {
    const data = await api.oauthRedirect.get({ params: payload.params, query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function oauthCallbackGetAction(payload: Parameters<typeof api.oauthCallback.get>[0]) {
  try {
    const data = await api.oauthCallback.get({ params: payload.params, query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function oauthCallbackPostAction(payload: Parameters<typeof api.oauthCallback.post>[0]) {
  try {
    const data = await api.oauthCallback.post({ params: payload.params })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function socialLoginCreateAction(payload: Parameters<typeof api.socialLogin.create>[0]) {
  try {
    const data = await api.socialLogin.create({ body: payload.body })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function forgotPasswordCreateAction(payload: Parameters<typeof api.forgotPassword.create>[0]) {
  try {
    const data = await api.forgotPassword.create({ body: payload.body })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function resetPasswordCreateAction(payload: Parameters<typeof api.resetPassword.create>[0]) {
  try {
    const data = await api.resetPassword.create({ body: payload.body })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function categoriesListAction(payload?: Parameters<typeof api.categories.list>[0]) {
  try {
    const data = await api.categories.list({ query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function produkListAction(payload?: Parameters<typeof api.produk.list>[0]) {
  try {
    const data = await api.produk.list({ query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function produkGetAction(payload: Parameters<typeof api.produk.get>[0]) {
  try {
    const data = await api.produk.get({ params: payload.params, query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function produkReviewsGetAction(payload: Parameters<typeof api.produkReviews.get>[0]) {
  try {
    const data = await api.produkReviews.get({ params: payload.params, query: payload?.query })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function produkReviewsPostAction(payload: Parameters<typeof api.produkReviews.post>[0]) {
  try {
    const data = await api.produkReviews.post({ params: payload.params, body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function paymentWebhookCreateAction() {
  try {
    const data = await api.paymentWebhook.create()
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function profileListAction(payload?: Parameters<typeof api.profile.list>[0]) {
  try {
    const data = await api.profile.list({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function profilePutAction(payload: Parameters<typeof api.profile.put>[0]) {
  try {
    const data = await api.profile.put({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function profilePatchAction(payload: Parameters<typeof api.profile.patch>[0]) {
  try {
    const data = await api.profile.patch({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function ordersListAction(payload?: Parameters<typeof api.orders.list>[0]) {
  try {
    const data = await api.orders.list({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function ordersGetAction(payload: Parameters<typeof api.orders.get>[0]) {
  try {
    const data = await api.orders.get({ params: payload.params, query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartItemsCreateAction(payload: Parameters<typeof api.cartItems.create>[0]) {
  try {
    const data = await api.cartItems.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartItemsUpdateAction(payload: Parameters<typeof api.cartItems.update>[0]) {
  try {
    const data = await api.cartItems.update({ params: payload.params, body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartItemsRemoveAction(payload: Parameters<typeof api.cartItems.remove>[0]) {
  try {
    const data = await api.cartItems.remove({ params: payload.params, query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartDeleteAction(payload?: Parameters<typeof api.cart.delete>[0]) {
  try {
    const data = await api.cart.delete({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartPromoCreateAction(payload: Parameters<typeof api.cartPromo.create>[0]) {
  try {
    const data = await api.cartPromo.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function cartPromoDeleteAction(payload?: Parameters<typeof api.cartPromo.delete>[0]) {
  try {
    const data = await api.cartPromo.delete({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function checkoutCreateAction(payload: Parameters<typeof api.checkout.create>[0]) {
  try {
    const data = await api.checkout.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function buyNowCreateAction(payload: Parameters<typeof api.buyNow.create>[0]) {
  try {
    const data = await api.buyNow.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function keranjangListAction(payload?: Parameters<typeof api.keranjang.list>[0]) {
  try {
    const data = await api.keranjang.list({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function wishlistListAction(payload?: Parameters<typeof api.wishlist.list>[0]) {
  try {
    const data = await api.wishlist.list({ query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function wishlistCreateAction(payload: Parameters<typeof api.wishlist.create>[0]) {
  try {
    const data = await api.wishlist.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function wishlistRemoveAction(payload: Parameters<typeof api.wishlist.remove>[0]) {
  try {
    const data = await api.wishlist.remove({ params: payload.params, query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function paymentPostAction(payload: Parameters<typeof api.payment.post>[0]) {
  try {
    const data = await api.payment.post({ params: payload.params, body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function ordersInvoiceGetAction(payload: Parameters<typeof api.ordersInvoice.get>[0]) {
  try {
    const data = await api.ordersInvoice.get({ params: payload.params, query: payload?.query, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function logoutCreateAction() {
  try {
    const data = await api.logout.create({ headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function adminProdukCreateAction(payload: Parameters<typeof api.adminProduk.create>[0]) {
  try {
    const data = await api.adminProduk.create({ body: payload.body, headers: await getAuthHeaders() })
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}
