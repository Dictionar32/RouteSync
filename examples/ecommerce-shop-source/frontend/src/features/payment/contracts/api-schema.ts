import { z } from "zod"

export const PaymentApiSchema = {
  Create: z.object({
    metode:          z.string().min(1, "Metode pembayaran wajib dipilih"),
    provider:        z.string().optional(),
    idempotencyKey:  z.string().optional(),
    detail:          z.record(z.string(), z.any()).optional(),
    gatewayCode:     z.string().optional(),
    gatewayMessage:  z.string().optional(),
  }),
  Update: z.object({
    transactionId: z.string().min(1, "Transaction ID wajib diisi"),
  })
}

export type PaymentFormValues = {
  Create: z.infer<typeof PaymentApiSchema.Create>
  Update: z.infer<typeof PaymentApiSchema.Update>
}

export const PaymentDefaultValues = {
  create: { metode: "" } as PaymentFormValues['Create'],
  update: { transactionId: "" } as PaymentFormValues['Update']
}
