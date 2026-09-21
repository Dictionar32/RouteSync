import { z } from "zod"

export const CartApiSchema = {
  Create: z.object({
    produkItemId: z.number().min(1, "Produk wajib dipilih"),
    qty: z.number().min(1, "Minimal 1"),
  }),
  Update: z.object({
    qty: z.number().min(1, "Minimal 1"),
  })
}

export type CartFormValues = {
  Create: z.infer<typeof CartApiSchema.Create>
  Update: z.infer<typeof CartApiSchema.Update>
}

export const CartDefaultValues = {
  create: { produkItemId: 0, qty: 1 } as CartFormValues['Create'],
  update: { qty: 1 } as CartFormValues['Update']
}
