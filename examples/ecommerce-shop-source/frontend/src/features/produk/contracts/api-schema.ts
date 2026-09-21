import { z } from "zod"

const CreateSchema = z.object({
  nama:       z.string().min(1, "Nama produk wajib diisi"),
  deskripsi:  z.string().min(1, "Deskripsi wajib diisi"),
  harga:      z.number().positive("Harga harus lebih dari 0"),
  stok:       z.number().int().nonnegative("Stok tidak boleh negatif"),
  categoryId: z.number().min(1, "Kategori wajib dipilih"),
  gambar:     z.instanceof(File).optional(),
})

export const ProdukApiSchema = {
  Create: CreateSchema,
  Update: CreateSchema.partial()
}

export type ProdukFormValues = {
  Create: z.infer<typeof ProdukApiSchema.Create>
  Update: z.infer<typeof ProdukApiSchema.Update>
}

export const ProdukDefaultValues = {
  create: {
    nama: "", deskripsi: "", harga: 0, stok: 0, categoryId: 0,
  } as ProdukFormValues['Create']
}
