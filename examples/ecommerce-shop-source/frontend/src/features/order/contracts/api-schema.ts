import { z } from "zod"

export const OrderApiSchema = {
  Create: z.object({
    shippingNama:    z.string().min(1, "Nama penerima wajib diisi"),
    shippingTelepon: z.string().optional(),
    shippingAlamat:  z.string().min(5, "Alamat lengkap wajib diisi"),
    shippingKota:    z.string().optional(),
    shippingKodePos: z.string().optional(),
  }),

  BuyNow: z.object({
    produkItemId: z.number(),
    qty: z.number().min(1),
    shippingNama:    z.string().optional(),
    shippingTelepon: z.string().optional(),
    shippingAlamat:  z.string().optional(),
    shippingKota:    z.string().optional(),
    shippingKodePos: z.string().optional(),
  })
}

export type OrderFormValues = {
  Create: z.infer<typeof OrderApiSchema.Create>
  BuyNow: z.infer<typeof OrderApiSchema.BuyNow>
}

export const OrderDefaultValues = {
  create: {
    shippingNama: "", shippingTelepon: "",
    shippingAlamat: "", shippingKota: "", shippingKodePos: "",
  } as OrderFormValues['Create']
}
