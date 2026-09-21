import { z } from 'zod'

export const Schema = z.object({
  id: z.number(),
  status: z.string(),
  total_harga: z.number(),
  invoice_number: z.string().nullable(),

  payment_status: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string(),

  subtotal_minor: z.number(),
  discount_minor: z.number(),
  shipping_minor: z.number(),
  tax_minor: z.number(),
  total_harga_minor: z.number(),
  created_at: z.string(),

  items: z.array(
    z.object({
      produk_item_id: z.number(),
      produk: z.object({
        id: z.number(),
        nama: z.string(),
        gambar: z.string().nullable(),
        image_url: z.string().nullable(),
      }),
      qty: z.number(),
      harga: z.number(),
      subtotal: z.number(),
    })
  ),

  promotion: z.object({
    code: z.string().nullable(),
    discount_minor: z.number().nullable(),
  }).nullable().optional(),

  shipping: z.object({
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
    kota: z.string().nullable(),
    kode_pos: z.string().nullable(),
  }).nullable().optional(),
});

export const IndexSchema = z.array(Schema)

export const CreateSchema = z.object({
  shipping_nama: z.string(),
  shipping_telepon: z.string(),
  shipping_alamat: z.string(),
  shipping_kota: z.string(),
  shipping_kode_pos: z.string(),
});

export const OrderListSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
  status: z.string().optional(),
})

export type OrderApiResponse = z.infer<typeof Schema>;
export type OrderApiIndex = z.infer<typeof IndexSchema>;
export type OrderApiCreate = z.infer<typeof CreateSchema>;

export const validateIndex = (payload: unknown): OrderApiIndex => IndexSchema.parse(payload);
export const validateSchema = (payload: unknown): OrderApiResponse => Schema.parse(payload);
export const validateCreate = (payload: unknown): OrderApiCreate => CreateSchema.parse(payload)
