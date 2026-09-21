import { z } from "zod"

export const CategoryApiSchema = {
  Create: z.object({
    nama: z.string().min(1, "Nama kategori wajib diisi"),
  }),
  Update: z.object({
    nama: z.string().min(1, "Nama kategori wajib diisi").optional(),
  })
}

export type CategoryFormValues = {
  Create: z.infer<typeof CategoryApiSchema.Create>
  Update: z.infer<typeof CategoryApiSchema.Update>
}

export const CategoryDefaultValues = {
  create: { nama: "" } as CategoryFormValues['Create']
}
