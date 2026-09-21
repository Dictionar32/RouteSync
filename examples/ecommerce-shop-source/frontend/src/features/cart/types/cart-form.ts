export type CartForm = {
  Create: {
    produkItemId: number
    qty: number
  }

  Update: {
    qty: number
  }
}