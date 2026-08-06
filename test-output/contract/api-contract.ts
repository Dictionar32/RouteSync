/**
 * API Contract Zod schemas untuk validation
 * Generated dari TypeIR - pure type renderer
 * 
 * Berisi KEDUA arah sesuai Engine.Fix.md §16:
 * - Response schemas (output backend)
 * - Payload schemas (input ke backend)
 */

import { z } from 'zod'

// ==== RESPONSE SCHEMAS (Backend Output) ====
// Validates data coming FROM backend

export const OrderDetailResourceSchema = z.object({
  id: z.unknown(),
  produk_item_id: z.unknown(),
  produk: z.object({
  id: z.unknown(),
  nama: z.unknown(),
  gambar: z.unknown(),
  image_url: z.string(),
}),
  qty: z.unknown(),
  harga: z.unknown(),
  subtotal: z.number(),
})

export type OrderDetailResourceResponse = z.infer<typeof OrderDetailResourceSchema>

export const validateOrderDetailResourceResponse = (payload: unknown): OrderDetailResourceResponse => 
  OrderDetailResourceSchema.parse(payload)

export const OrderResourceSchema = z.object({
  id: z.unknown(),
  status: z.unknown(),
  total_harga: z.unknown(),
  invoice_number: z.unknown(),
  payment_status: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string(),
  subtotal_minor: z.number(),
  discount_minor: z.number(),
  shipping_minor: z.number(),
  tax_minor: z.number(),
  total_harga_minor: z.number(),
  items: z.unknown(),
  promotion: z.object({
  code: z.unknown(),
  discount_minor: z.number(),
}),
  shipping: z.object({
  nama: z.unknown(),
  telepon: z.unknown(),
  alamat: z.unknown(),
  kota: z.unknown(),
  kode_pos: z.unknown(),
}),
  created_at: z.string(),
})

export type OrderResourceResponse = z.infer<typeof OrderResourceSchema>

export const validateOrderResourceResponse = (payload: unknown): OrderResourceResponse => 
  OrderResourceSchema.parse(payload)

export const PaymentResourceSchema = z.object({
  id: z.unknown(),
  order_id: z.unknown(),
  invoice_number: z.unknown(),
  metode: z.unknown(),
  detail: z.unknown(),
  status: z.unknown(),
  paid_at: z.unknown(),
  provider: z.unknown(),
  provider_txn_id: z.unknown(),
  gateway_status: z.unknown(),
  amount_minor: z.unknown(),
  refund_amount_minor: z.unknown(),
  items: z.unknown(),
  promotion: z.object({
  code: z.unknown(),
  discount_minor: z.number(),
}),
  gateway: z.object({
  name: z.unknown(),
  order_id: z.unknown(),
  token: z.unknown(),
  redirect_url: z.unknown(),
}),
  total_harga: z.unknown(),
})

export type PaymentResourceResponse = z.infer<typeof PaymentResourceSchema>

export const validatePaymentResourceResponse = (payload: unknown): PaymentResourceResponse => 
  PaymentResourceSchema.parse(payload)

export const ProdukItemResourceSchema = z.object({
  id: z.unknown(),
  nama: z.unknown(),
  deskripsi: z.unknown(),
  image: z.unknown(),
  image_url: z.string(),
  category_id: z.unknown(),
  category_name: z.unknown(),
  harga: z.unknown(),
  stok: z.unknown(),
  rating: z.number(),
  review_count: z.number(),
})

export type ProdukItemResourceResponse = z.infer<typeof ProdukItemResourceSchema>

export const validateProdukItemResourceResponse = (payload: unknown): ProdukItemResourceResponse => 
  ProdukItemResourceSchema.parse(payload)

export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.string().nullable(),
})

export type RegisterResponseResponse = z.infer<typeof RegisterResponseSchema>

export const validateRegisterResponseResponse = (payload: unknown): RegisterResponseResponse => 
  RegisterResponseSchema.parse(payload)

export const OauthRedirectSchema = z.object({
  provider: z.string(),
  auth_url: z.unknown(),
})

export type OauthRedirectResponse = z.infer<typeof OauthRedirectSchema>

export const validateOauthRedirectResponse = (payload: unknown): OauthRedirectResponse => 
  OauthRedirectSchema.parse(payload)

export const OauthCallbackSchema = z.object({
  message: z.string(),
  error: z.unknown(),
})

export type OauthCallbackResponse = z.infer<typeof OauthCallbackSchema>

export const validateOauthCallbackResponse = (payload: unknown): OauthCallbackResponse => 
  OauthCallbackSchema.parse(payload)

export const CategoriesSchema = z.object({
  data: z.unknown(),
})

export type CategoriesResponse = z.infer<typeof CategoriesSchema>

export const validateCategoriesResponse = (payload: unknown): CategoriesResponse => 
  CategoriesSchema.parse(payload)

export const ProdukReviewsSchema = z.object({
  summary: z.object({
  avg_rating: z.number(),
  total_review: z.number(),
}),
  reviews: z.unknown(),
})

export type ProdukReviewsResponse = z.infer<typeof ProdukReviewsSchema>

export const validateProdukReviewsResponse = (payload: unknown): ProdukReviewsResponse => 
  ProdukReviewsSchema.parse(payload)

export const ProfileSchema = z.object({
  id: z.unknown(),
  name: z.unknown(),
  email: z.unknown(),
})

export type ProfileResponse = z.infer<typeof ProfileSchema>

export const validateProfileResponse = (payload: unknown): ProfileResponse => 
  ProfileSchema.parse(payload)

export const ProdukItemSchema = z.object({
  id: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type ProdukItemResponse = z.infer<typeof ProdukItemSchema>

export const validateProdukItemResponse = (payload: unknown): ProdukItemResponse => 
  ProdukItemSchema.parse(payload)

export const OrderSchema = z.object({
  id: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderResponse = z.infer<typeof OrderSchema>

export const validateOrderResponse = (payload: unknown): OrderResponse => 
  OrderSchema.parse(payload)

export const PaymentSchema = z.object({
  id: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PaymentResponse = z.infer<typeof PaymentSchema>

export const validatePaymentResponse = (payload: unknown): PaymentResponse => 
  PaymentSchema.parse(payload)

// ==== COLLECTION RESPONSE SCHEMAS ====
export const OrderDetailsResponseSchema = z.object({
  data: z.array(OrderDetailResourceSchema)
})

export const validateOrderDetailResourceCollectionResponse = (payload: unknown) =>
  OrderDetailsResponseSchema.parse(payload)

export const OrdersResponseSchema = z.object({
  data: z.array(OrderResourceSchema)
})

export const validateOrderResourceCollectionResponse = (payload: unknown) =>
  OrdersResponseSchema.parse(payload)

export const PaymentsResponseSchema = z.object({
  data: z.array(PaymentResourceSchema)
})

export const validatePaymentResourceCollectionResponse = (payload: unknown) =>
  PaymentsResponseSchema.parse(payload)

export const ProdukItemsResponseSchema = z.object({
  data: z.array(ProdukItemResourceSchema)
})

export const validateProdukItemResourceCollectionResponse = (payload: unknown) =>
  ProdukItemsResponseSchema.parse(payload)

export const RegisterResponsesResponseSchema = z.object({
  data: z.array(RegisterResponseSchema)
})

export const validateRegisterResponseCollectionResponse = (payload: unknown) =>
  RegisterResponsesResponseSchema.parse(payload)

export const OauthRedirectsResponseSchema = z.object({
  data: z.array(OauthRedirectSchema)
})

export const validateOauthRedirectCollectionResponse = (payload: unknown) =>
  OauthRedirectsResponseSchema.parse(payload)

export const OauthCallbacksResponseSchema = z.object({
  data: z.array(OauthCallbackSchema)
})

export const validateOauthCallbackCollectionResponse = (payload: unknown) =>
  OauthCallbacksResponseSchema.parse(payload)

export const CategoriessResponseSchema = z.object({
  data: z.array(CategoriesSchema)
})

export const validateCategoriesCollectionResponse = (payload: unknown) =>
  CategoriessResponseSchema.parse(payload)

export const ProdukReviewssResponseSchema = z.object({
  data: z.array(ProdukReviewsSchema)
})

export const validateProdukReviewsCollectionResponse = (payload: unknown) =>
  ProdukReviewssResponseSchema.parse(payload)

export const ProfilesResponseSchema = z.object({
  data: z.array(ProfileSchema)
})

export const validateProfileCollectionResponse = (payload: unknown) =>
  ProfilesResponseSchema.parse(payload)

export const ProdukItemsResponseSchema = z.object({
  data: z.array(ProdukItemSchema)
})

export const validateProdukItemCollectionResponse = (payload: unknown) =>
  ProdukItemsResponseSchema.parse(payload)

export const OrdersResponseSchema = z.object({
  data: z.array(OrderSchema)
})

export const validateOrderCollectionResponse = (payload: unknown) =>
  OrdersResponseSchema.parse(payload)

export const PaymentsResponseSchema = z.object({
  data: z.array(PaymentSchema)
})

export const validatePaymentCollectionResponse = (payload: unknown) =>
  PaymentsResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend
