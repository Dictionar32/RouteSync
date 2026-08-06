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
  id: z.number(),
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
})

export type OrderDetailResourceResponse = z.infer<typeof OrderDetailResourceSchema>

export const validateOrderDetailResourceResponse = (payload: unknown): OrderDetailResourceResponse => 
  OrderDetailResourceSchema.parse(payload)

export const OrderResourceSchema = z.object({
  id: z.number(),
  status: z.string(),
  total_harga: z.number(),
  invoice_number: z.string(),
  payment_status: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string(),
  subtotal_minor: z.number(),
  discount_minor: z.number(),
  shipping_minor: z.number(),
  tax_minor: z.number(),
  total_harga_minor: z.number(),
  items: z.array(OrderDetailResourceSchema),
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
  created_at: z.string(),
})

export type OrderResourceResponse = z.infer<typeof OrderResourceSchema>

export const validateOrderResourceResponse = (payload: unknown): OrderResourceResponse => 
  OrderResourceSchema.parse(payload)

export const PaymentResourceSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  invoice_number: z.string(),
  metode: z.string(),
  detail: z.string(),
  status: z.string(),
  paid_at: z.string(),
  provider: z.string(),
  provider_txn_id: z.string(),
  gateway_status: z.string(),
  amount_minor: z.number(),
  refund_amount_minor: z.unknown(),
  items: z.array(OrderDetailResourceSchema),
  promotion: z.object({
  code: z.string(),
  discount_minor: z.number(),
}),
  gateway: z.object({
  name: z.unknown(),
  order_id: z.unknown(),
  token: z.unknown(),
  redirect_url: z.unknown(),
}),
  total_harga: z.number(),
})

export type PaymentResourceResponse = z.infer<typeof PaymentResourceSchema>

export const validatePaymentResourceResponse = (payload: unknown): PaymentResourceResponse => 
  PaymentResourceSchema.parse(payload)

export const ProdukItemResourceSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string(),
  image: z.string(),
  image_url: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  harga: z.number(),
  stok: z.number(),
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
  data: CategorySchema,
})

export type CategoriesResponse = z.infer<typeof CategoriesSchema>

export const validateCategoriesResponse = (payload: unknown): CategoriesResponse => 
  CategoriesSchema.parse(payload)

export const ProdukReviewsSchema = z.object({
  summary: z.object({
  avg_rating: z.number(),
  total_review: z.number(),
}),
  reviews: ProductReviewSchema,
})

export type ProdukReviewsResponse = z.infer<typeof ProdukReviewsSchema>

export const validateProdukReviewsResponse = (payload: unknown): ProdukReviewsResponse => 
  ProdukReviewsSchema.parse(payload)

export const ProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
})

export type ProfileResponse = z.infer<typeof ProfileSchema>

export const validateProfileResponse = (payload: unknown): ProfileResponse => 
  ProfileSchema.parse(payload)

export const CategorySchema = z.object({
  id: z.number(),
  nama: z.string(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type CategoryResponse = z.infer<typeof CategorySchema>

export const validateCategoryResponse = (payload: unknown): CategoryResponse => 
  CategorySchema.parse(payload)

export const OrderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_harga: z.number(),
  status: z.string(),
  order_number: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderResponse = z.infer<typeof OrderSchema>

export const validateOrderResponse = (payload: unknown): OrderResponse => 
  OrderSchema.parse(payload)

export const PaymentSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  metode: z.string().nullable(),
  status: z.string(),
  paid_at: z.unknown().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PaymentResponse = z.infer<typeof PaymentSchema>

export const validatePaymentResponse = (payload: unknown): PaymentResponse => 
  PaymentSchema.parse(payload)

export const ProductReviewSchema = z.object({
  id: z.number(),
  produk_item_id: z.number(),
  user_id: z.number(),
  rating: z.number(),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  is_verified_purchase: z.boolean(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type ProductReviewResponse = z.infer<typeof ProductReviewSchema>

export const validateProductReviewResponse = (payload: unknown): ProductReviewResponse => 
  ProductReviewSchema.parse(payload)

export const ProdukItemSchema = z.object({
  id: z.number(),
  nama: z.string(),
  deskripsi: z.string().nullable(),
  category_id: z.number().nullable(),
  harga: z.number(),
  stok: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type ProdukItemResponse = z.infer<typeof ProdukItemSchema>

export const validateProdukItemResponse = (payload: unknown): ProdukItemResponse => 
  ProdukItemSchema.parse(payload)

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

export const CategorysResponseSchema = z.object({
  data: z.array(CategorySchema)
})

export const validateCategoryCollectionResponse = (payload: unknown) =>
  CategorysResponseSchema.parse(payload)

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

export const ProductReviewsResponseSchema = z.object({
  data: z.array(ProductReviewSchema)
})

export const validateProductReviewCollectionResponse = (payload: unknown) =>
  ProductReviewsResponseSchema.parse(payload)

export const ProdukItemsResponseSchema = z.object({
  data: z.array(ProdukItemSchema)
})

export const validateProdukItemCollectionResponse = (payload: unknown) =>
  ProdukItemsResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend
