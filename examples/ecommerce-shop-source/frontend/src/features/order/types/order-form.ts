export type OrderForm = {
  Create: {
    shippingNama: string
    shippingTelepon: string
    shippingAlamat: string
    shippingKota: string
    shippingKodePos: string
  }

  BuyNow: Partial<{
    shippingNama: string
    shippingTelepon: string
    shippingAlamat: string
    shippingKota: string
    shippingKodePos: string
  }> & {
    produkItemId: number
    qty: number
  }
}
