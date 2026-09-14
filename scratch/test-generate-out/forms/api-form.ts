/**
 * Generated Form Types
 * Do not edit directly.
 */

export type LoginForm = {
  Update: {
    email: string
    password: string
  }
};

export type RegisterForm = {
  Update: {
    name: string
    email: string
    password: string
  }
};

export type BuyNowForm = {
  Create: {
    produkItemId: number
    qty: number
    shippingNama: string | null
    shippingTelepon: string | null
    shippingAlamat: string | null
    shippingKota: string | null
    shippingKodePos: string | null
  }
};

export type CartItemForm = {
  Create: {
    produkItemId: number
    qty: number
  }
  Update: {
    qty: number
  }
};

export type OrderForm = {
  Create: {
    items?: Array<{ produkItemId: number; qty: number }>
    shippingNama: string | null
    shippingTelepon: string | null
    shippingAlamat: string | null
    shippingKota: string | null
    shippingKodePos: string | null
  }
};

export type PaymentForm = {
  Create: {
    metode: string
    detail: Array<unknown> | null
    provider: string | null
    providerTxnId: string | null
    idempotencyKey: string | null
    gatewayCode: string | null
    gatewayMessage: string | null
  }
};

export type ProfileForm = {
  Update: {
    name: string
    email: string
  }
};
