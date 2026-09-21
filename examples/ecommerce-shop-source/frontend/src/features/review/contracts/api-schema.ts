import { z } from "zod"

export const ReviewApiSchema = {
  Create: z.object({
    rating:  z.number().min(1, "Pilih rating").max(5),
    title:   z.string().optional(),
    comment: z.string().min(5, "Ulasan minimal 5 karakter"),
  })
}

export type ReviewFormValues = {
  Create: z.infer<typeof ReviewApiSchema.Create>
}

export const ReviewDefaultValues = {
  create: { rating: 0, comment: "", title: "" } as ReviewFormValues['Create']
}
