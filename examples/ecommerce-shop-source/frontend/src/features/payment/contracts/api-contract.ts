import { z } from 'zod'

// ==============================
// ENUMS
// ==============================
export const PaymentStatusEnum = z.enum([
  'pending',
  'paid',
  'failed',
])

// ==============================
// ITEM SCHEMA
// ==============================
export const ItemSchema = z.object({
  id: z.number(),
  produk_item_id: z.number(),
  nama: z.string(),
  gambar: z.string(),
  image_url: z.string(),
  qty: z.number(),
  harga: z.number(),
  subtotal: z.number(),
})

// ==============================
// PAYMENT RESPONSE SCHEMA
// ==============================
export const Schema = z.object({
  // Order info
  id: z.number(),
  order_id: z.number(),
  invoice_number: z.string().nullable(),
  status: PaymentStatusEnum, // pakai enum
  total_harga: z.number(),
  subtotal_minor: z.number(),
  discount_minor: z.number(),
  shipping_minor: z.number(),
  tax_minor: z.number(),
  total_harga_minor: z.number(),
  payment_status: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string(),
  created_at: z.string(),

  // Shipping info (nested)
  shipping: z.object({
    nama: z.string().nullable(),
    telepon: z.string().nullable(),
    alamat: z.string().nullable(),
    kota: z.string().nullable(),
    kode_pos: z.string().nullable(),
  }),

  // Promo info (nested)
  promo: z.object({
    code: z.string().nullable(),
    discount_minor: z.number(),
  }),

  // Payment info (nested)
  payment: z.object({
    id: z.number().nullable(),
    metode: z.string().nullable(),
    status_detail: z.string().nullable(),
    paid_at: z.string().nullable(),
    provider: z.string().nullable(),
    provider_txn_id: z.string().nullable(),
    gateway_status: z.string().nullable(),
    amount_minor: z.number().nullable(),
    refund_amount_minor: z.number().nullable(),
    gateway_name: z.string().nullable(),
    gateway_order_id: z.string().nullable(),
    gateway_token: z.string().nullable(),
    gateway_redirect_url: z.string().nullable(),
  }),

  // Items array
  items: z.array(ItemSchema),
})

// ==============================
// INDEX SCHEMA
// ==============================
export const IndexSchema = z.array(Schema)

// ==============================
// CREATE PAYMENT SCHEMA
// ==============================
export const CreateSchema = z.object({
  metode: z.string(),
})

// ==============================
// TYPES
// ==============================
export type PaymentApiResponse = z.infer<typeof Schema>
export type PaymentApiIndex = z.infer<typeof IndexSchema>
export type PaymentApiCreate = z.infer<typeof CreateSchema>
export type PaymentApiItemDetail = z.infer<typeof ItemSchema>

// ==============================
// VALIDATORS
// ==============================
export const validateResponse = (payload: unknown): PaymentApiResponse =>
  Schema.parse(payload)

export const validateIndex = (payload: unknown): PaymentApiIndex =>
  IndexSchema.parse(payload)

export const validateCreate = (payload: unknown): PaymentApiCreate =>
  CreateSchema.parse(payload)