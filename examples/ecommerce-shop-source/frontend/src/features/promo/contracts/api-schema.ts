import { z } from "zod"

export const PromoApiSchema = {
  Apply: z.object({
    code: z.string().min(1, "Kode promo wajib diisi"),
  })
}

export type PromoFormValues = {
  Apply: z.infer<typeof PromoApiSchema.Apply>
  Create: z.infer<typeof PromoApiSchema.Apply>
}

export const PromoDefaultValues = {
  apply: { code: "" } as PromoFormValues['Apply']
}
