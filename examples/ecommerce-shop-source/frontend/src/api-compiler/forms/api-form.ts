/**
 * Form type definitions untuk input validation
 * Generated dari RequestIR - Contract IR Architecture
 * 
 * Note: Struktur mirip dengan api-schema.ts tapi untuk pure TypeScript types
 */

export type RegisterForm = {
  create: {
    name: string
    email: string
    password: string
  }
}

export type LoginForm = {
  create: {
    email: string
    password: string
  }
}

export type OauthForm = {
  custom: {
    redirectTo: string | null | undefined
  }
}

export type SocialForm = {
  create: {
    provider: string
    providerUserId: string
    email: string
    name: string | null | undefined
    avatarUrl: string | null | undefined
  }
}

export type ForgotPasswordForm = {
  create: {
    email: string
  }
}

export type ResetPasswordForm = {
  create: {
    email: string
    token: string
    password: string
  }
}

export type ProfileForm = {
  update: {
    name: string
    email: string
  }
}

export type CartForm = {
  create: {
    produkItemId: string
    qty: number
    code: string
  }
}

export type CheckoutForm = {
  create: {
    items: unknown | undefined
    items.*.produkItemId: string | undefined
    items.*.qty: number | undefined
    shippingNama: string | null | undefined
    shippingTelepon: string | null | undefined
    shippingAlamat: string | null | undefined
    shippingKota: string | null | undefined
    shippingKodePos: string | null | undefined
  }
}

export type BuyNowForm = {
  create: {
    produkItemId: string
    qty: number
    shippingNama: string | null | undefined
    shippingTelepon: string | null | undefined
    shippingAlamat: string | null | undefined
    shippingKota: string | null | undefined
    shippingKodePos: string | null | undefined
  }
}

export type WishlistForm = {
  create: {
    produkItemId: string
  }
}

export type ProdukForm = {
  create: {
    rating: number
    title: string | null | undefined
    comment: string | null | undefined
  }
}

export type PaymentForm = {
  create: {
    metode: string
    detail: unknown | null | undefined
    provider: string | null | undefined
    providerTxnId: string | null | undefined
    idempotencyKey: string | null | undefined
    gatewayCode: string | null | undefined
    gatewayMessage: string | null | undefined
  }
}

export type AdminForm = {
  create: {
    nama: string
    deskripsi: string | null | undefined
    gambar: string | null | undefined
    categoryId: string
    harga: number
    stok: number
    rating: number | null | undefined
    jumlahReview: number | null | undefined
  }
}
