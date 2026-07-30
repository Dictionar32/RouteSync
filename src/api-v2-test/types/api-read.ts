export interface RegisterResponseTransformed {
  readonly rules: string
}

export type RegisterResponseShow = RegisterResponseTransformed
export type RegisterResponseIndex = RegisterResponseTransformed[]

export interface ProdukItemTransformed {
  readonly rules: string
}

export type ProdukItemShow = ProdukItemTransformed
export type ProdukItemIndex = ProdukItemTransformed[]

export interface OrderTransformed {
  readonly rules: string
}

export type OrderShow = OrderTransformed
export type OrderIndex = OrderTransformed[]

export interface PaymentTransformed {
  readonly rules: string
}

export type PaymentShow = PaymentTransformed
export type PaymentIndex = PaymentTransformed[]
