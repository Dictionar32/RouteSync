import { z } from "zod";

export const Schema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  category_id: z.number(),
  category_name: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  rating: z.number(),
  review_count: z.number(),
  first_item_id: z.number().optional(),
});

export const IndexSchema = z.array(Schema);

export const CreateSchema = z.object({
  nama: z.string().min(1),
  deskripsi: z.string().min(1),
  gambar: z.string().optional(),
  category_id: z.number(),
  harga: z.number().positive(),
  stok: z.number().int().nonnegative(),
});

export const UpdateSchema = CreateSchema.partial();

export type ProdukApiResponse = z.infer<typeof Schema>
export type ProdukApiIndex = z.infer<typeof IndexSchema>
export type ProdukApiCreate = z.infer<typeof CreateSchema>
export type ProdukApiUpdate = z.infer<typeof UpdateSchema>

export const ValidateSchema = (payload: unknown): ProdukApiResponse => Schema.parse(payload)
export const ValidateIndex = (payload: unknown): ProdukApiIndex => IndexSchema.parse(payload)
export const ValidateCreate = (payload: unknown): ProdukApiCreate => CreateSchema.parse(payload)
export const ValidateUpdate = (payload: unknown): ProdukApiUpdate => UpdateSchema.parse(payload)
