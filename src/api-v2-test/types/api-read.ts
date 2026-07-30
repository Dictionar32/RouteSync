export interface RegisterResponseTransformed {
  readonly name: unknown
  readonly email: unknown
  readonly password: unknown
}

export type RegisterResponseShow = RegisterResponseTransformed
export type RegisterResponseIndex = RegisterResponseTransformed[]

export interface ProdukItemTransformed {
  readonly nama: unknown
  readonly deskripsi: unknown
  readonly gambar: unknown
  readonly categoryId: unknown
  readonly harga: unknown
  readonly stok: unknown
  readonly rating: unknown
  readonly jumlahReview: unknown
}

export type ProdukItemShow = ProdukItemTransformed
export type ProdukItemIndex = ProdukItemTransformed[]

export interface OrderTransformed {
  readonly produkItemId: unknown
  readonly qty: unknown
  readonly code: unknown
  readonly items: unknown
  readonly itemsprodukItemId: unknown
  readonly itemsqty: unknown
  readonly shippingNama: unknown
  readonly shippingTelepon: unknown
  readonly shippingAlamat: unknown
  readonly shippingKota: unknown
  readonly shippingKodePos: unknown
}

export type OrderShow = OrderTransformed
export type OrderIndex = OrderTransformed[]

export interface PaymentTransformed {
  readonly metode: unknown
  readonly detail: unknown
  readonly provider: unknown
  readonly providerTxnId: unknown
  readonly idempotencyKey: unknown
  readonly gatewayCode: unknown
  readonly gatewayMessage: unknown
}

export type PaymentShow = PaymentTransformed
export type PaymentIndex = PaymentTransformed[]
