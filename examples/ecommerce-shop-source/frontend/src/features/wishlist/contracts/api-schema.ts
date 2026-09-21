import { z } from "zod"

export const WishlistApiSchema = {
  Create: z.object({
    produkItemId: z.number(),
  })
}

export type WishlistFormValues = {
  Create: z.infer<typeof WishlistApiSchema.Create>
}

export const WishlistDefaultValues = {
  create: { produkItemId: 0 } as WishlistFormValues['Create']
}
