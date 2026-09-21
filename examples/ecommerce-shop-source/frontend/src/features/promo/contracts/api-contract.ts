import { z } from "zod"

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

  items: z.array(z.object({
    produk_item_id: z.number(),
    produk: z.object({
      id: z.number(),
      nama: z.string(),
      gambar: z.string(),
      image_url: z.string(),
    }),
    qty: z.number(),
    harga: z.number(),
    subtotal: z.number(),
  })),

  promotion: z.object({
    code: z.string(),
    discount_minor: z.number(),
  }),

  shipping: z.object({
    nama: z.string(),
    telepon: z.string(),
    alamat: z.string(),
    kota: z.string(),
    kode_pos: z.string(),
  }),
});

export const IndexSchema = z.array(Schema);

export const CreateSchema = z.object({
  code: z.string().min(1),
});

export const UpdateSchema = z.object({
  code: z.string().min(1).optional(),
})

// type inference
export type PromoApiResponse = z.infer<typeof Schema>
export type PromoApiIndex = z.infer<typeof IndexSchema>;
export type PromoApiCreate = z.infer<typeof CreateSchema>;
export type PromoApiUpdate = z.infer<typeof UpdateSchema>;

// validator
export const validateSchema = (payload: unknown): PromoApiResponse => Schema.parse(payload);
export const validateIndex = (payload: unknown): PromoApiIndex => IndexSchema.parse(payload);
export const validateCreate = (payload: unknown): PromoApiCreate => CreateSchema.parse(payload);
export const validateUpdate = (payload: unknown): PromoApiUpdate => UpdateSchema.parse(payload);