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
  image_url: z.unknown(),
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
  discount_minor: z.unknown(),
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
  discount_minor: z.unknown(),
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
  data: z.unknown().nullable().optional(),
})

export type RegisterResponseResponse = z.infer<typeof RegisterResponseSchema>

export const validateRegisterResponseResponse = (payload: unknown): RegisterResponseResponse => 
  RegisterResponseSchema.parse(payload)

export const ProdukItemSchema = z.object({
  id: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type ProdukItemResponse = z.infer<typeof ProdukItemSchema>

export const validateProdukItemResponse = (payload: unknown): ProdukItemResponse => 
  ProdukItemSchema.parse(payload)

export const OrderSchema = z.object({
  id: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type OrderResponse = z.infer<typeof OrderSchema>

export const validateOrderResponse = (payload: unknown): OrderResponse => 
  OrderSchema.parse(payload)

export const PaymentSchema = z.object({
  id: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type PaymentResponse = z.infer<typeof PaymentSchema>

export const validatePaymentResponse = (payload: unknown): PaymentResponse => 
  PaymentSchema.parse(payload)

export const RegisterSchema = z.object({
  id: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type RegisterResponse = z.infer<typeof RegisterSchema>

export const validateRegisterResponse = (payload: unknown): RegisterResponse => 
  RegisterSchema.parse(payload)

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
  token: z.unknown(),
  user: z.object({
  id: z.unknown(),
  name: z.unknown(),
  email: z.unknown(),
  role: z.unknown(),
  created_at: z.unknown(),
  updated_at: z.unknown(),
}),
}),
})

export type LoginResponseResponse = z.infer<typeof LoginResponseSchema>

export const validateLoginResponseResponse = (payload: unknown): LoginResponseResponse => 
  LoginResponseSchema.parse(payload)

export const RedirectResponseSchema = z.object({
  provider: z.unknown(),
  auth_url: z.unknown(),
})

export type RedirectResponseResponse = z.infer<typeof RedirectResponseSchema>

export const validateRedirectResponseResponse = (payload: unknown): RedirectResponseResponse => 
  RedirectResponseSchema.parse(payload)

export const CallbackResponseSchema = z.object({
  message: z.string(),
  error: z.unknown(),
})

export type CallbackResponseResponse = z.infer<typeof CallbackResponseSchema>

export const validateCallbackResponseResponse = (payload: unknown): CallbackResponseResponse => 
  CallbackResponseSchema.parse(payload)

export const ResetPasswordResponseSchema = z.object({
  message: z.string(),
})

export type ResetPasswordResponseResponse = z.infer<typeof ResetPasswordResponseSchema>

export const validateResetPasswordResponseResponse = (payload: unknown): ResetPasswordResponseResponse => 
  ResetPasswordResponseSchema.parse(payload)

export const CategoriesResponseSchema = z.object({
  data: z.unknown(),
})

export type CategoriesResponseResponse = z.infer<typeof CategoriesResponseSchema>

export const validateCategoriesResponseResponse = (payload: unknown): CategoriesResponseResponse => 
  CategoriesResponseSchema.parse(payload)

export const ReviewsResponseSchema = z.object({
  summary: z.object({
  avg_rating: z.unknown(),
  total_review: z.unknown(),
}),
  reviews: z.unknown(),
})

export type ReviewsResponseResponse = z.infer<typeof ReviewsResponseSchema>

export const validateReviewsResponseResponse = (payload: unknown): ReviewsResponseResponse => 
  ReviewsResponseSchema.parse(payload)

export const ProfileResponseSchema = z.object({
  id: z.unknown(),
  name: z.unknown(),
  email: z.unknown(),
})

export type ProfileResponseResponse = z.infer<typeof ProfileResponseSchema>

export const validateProfileResponseResponse = (payload: unknown): ProfileResponseResponse => 
  ProfileResponseSchema.parse(payload)

export const CartResponseSchema = z.object({
  message: z.string(),
})

export type CartResponseResponse = z.infer<typeof CartResponseSchema>

export const validateCartResponseResponse = (payload: unknown): CartResponseResponse => 
  CartResponseSchema.parse(payload)

export const WishlistResponseSchema = z.object({
  message: z.string(),
})

export type WishlistResponseResponse = z.infer<typeof WishlistResponseSchema>

export const validateWishlistResponseResponse = (payload: unknown): WishlistResponseResponse => 
  WishlistResponseSchema.parse(payload)

export const LogoutResponseSchema = z.object({
  message: z.string(),
})

export type LogoutResponseResponse = z.infer<typeof LogoutResponseSchema>

export const validateLogoutResponseResponse = (payload: unknown): LogoutResponseResponse => 
  LogoutResponseSchema.parse(payload)

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

export const RegistersResponseSchema = z.object({
  data: z.array(RegisterSchema)
})

export const validateRegisterCollectionResponse = (payload: unknown) =>
  RegistersResponseSchema.parse(payload)

export const LoginResponsesResponseSchema = z.object({
  data: z.array(LoginResponseSchema)
})

export const validateLoginResponseCollectionResponse = (payload: unknown) =>
  LoginResponsesResponseSchema.parse(payload)

export const RedirectResponsesResponseSchema = z.object({
  data: z.array(RedirectResponseSchema)
})

export const validateRedirectResponseCollectionResponse = (payload: unknown) =>
  RedirectResponsesResponseSchema.parse(payload)

export const CallbackResponsesResponseSchema = z.object({
  data: z.array(CallbackResponseSchema)
})

export const validateCallbackResponseCollectionResponse = (payload: unknown) =>
  CallbackResponsesResponseSchema.parse(payload)

export const ResetPasswordResponsesResponseSchema = z.object({
  data: z.array(ResetPasswordResponseSchema)
})

export const validateResetPasswordResponseCollectionResponse = (payload: unknown) =>
  ResetPasswordResponsesResponseSchema.parse(payload)

export const CategoriesResponsesResponseSchema = z.object({
  data: z.array(CategoriesResponseSchema)
})

export const validateCategoriesResponseCollectionResponse = (payload: unknown) =>
  CategoriesResponsesResponseSchema.parse(payload)

export const ReviewsResponsesResponseSchema = z.object({
  data: z.array(ReviewsResponseSchema)
})

export const validateReviewsResponseCollectionResponse = (payload: unknown) =>
  ReviewsResponsesResponseSchema.parse(payload)

export const ProfileResponsesResponseSchema = z.object({
  data: z.array(ProfileResponseSchema)
})

export const validateProfileResponseCollectionResponse = (payload: unknown) =>
  ProfileResponsesResponseSchema.parse(payload)

export const CartResponsesResponseSchema = z.object({
  data: z.array(CartResponseSchema)
})

export const validateCartResponseCollectionResponse = (payload: unknown) =>
  CartResponsesResponseSchema.parse(payload)

export const WishlistResponsesResponseSchema = z.object({
  data: z.array(WishlistResponseSchema)
})

export const validateWishlistResponseCollectionResponse = (payload: unknown) =>
  WishlistResponsesResponseSchema.parse(payload)

export const LogoutResponsesResponseSchema = z.object({
  data: z.array(LogoutResponseSchema)
})

export const validateLogoutResponseCollectionResponse = (payload: unknown) =>
  LogoutResponsesResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend
