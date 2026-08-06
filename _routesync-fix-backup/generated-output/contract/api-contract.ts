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
  banana: z.string(),
  potato: z.number(),
  flying_dog: z.boolean(),
  foo: z.unknown(),
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
  items: z.unknown(),
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
  provider: z.unknown(),
  provider_txn_id: z.unknown(),
  gateway_status: z.unknown(),
  amount_minor: z.unknown(),
  refund_amount_minor: z.unknown(),
  items: z.unknown(),
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
  provider: z.unknown(),
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
  id: z.string(),
  name: z.string(),
  email: z.string(),
})

export type ProfileResponse = z.infer<typeof ProfileSchema>

export const validateProfileResponse = (payload: unknown): ProfileResponse => 
  ProfileSchema.parse(payload)

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

export const CategorySchema = z.object({
  id: z.number(),
  nama: z.string(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type CategoryResponse = z.infer<typeof CategorySchema>

export const validateCategoryResponse = (payload: unknown): CategoryResponse => 
  CategorySchema.parse(payload)

export const OrderAmountSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  subtotal_minor: z.number(),
  shipping_minor: z.number(),
  discount_minor: z.number(),
  tax_minor: z.number(),
  total_minor: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderAmountResponse = z.infer<typeof OrderAmountSchema>

export const validateOrderAmountResponse = (payload: unknown): OrderAmountResponse => 
  OrderAmountSchema.parse(payload)

export const OrderDetailSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  produk_item_id: z.number(),
  qty: z.number(),
  harga: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
  banana: z.string().nullable(),
  potato: z.number().nullable(),
  flying_dog: z.boolean().nullable(),
})

export type OrderDetailResponse = z.infer<typeof OrderDetailSchema>

export const validateOrderDetailResponse = (payload: unknown): OrderDetailResponse => 
  OrderDetailSchema.parse(payload)

export const OrderFinancialSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  financial_status: z.string(),
  refunded_at: z.unknown().nullable(),
  refund_reason: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderFinancialResponse = z.infer<typeof OrderFinancialSchema>

export const validateOrderFinancialResponse = (payload: unknown): OrderFinancialResponse => 
  OrderFinancialSchema.parse(payload)

export const OrderFulfillmentSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  fulfillment_status: z.string(),
  processing_at: z.unknown().nullable(),
  shipped_at: z.unknown().nullable(),
  completed_at: z.unknown().nullable(),
  canceled_at: z.unknown().nullable(),
  cancel_reason: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderFulfillmentResponse = z.infer<typeof OrderFulfillmentSchema>

export const validateOrderFulfillmentResponse = (payload: unknown): OrderFulfillmentResponse => 
  OrderFulfillmentSchema.parse(payload)

export const OrderPromotionSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  promo_code_id: z.number().nullable(),
  promo_code: z.string(),
  discount_minor: z.number(),
  metadata: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderPromotionResponse = z.infer<typeof OrderPromotionSchema>

export const validateOrderPromotionResponse = (payload: unknown): OrderPromotionResponse => 
  OrderPromotionSchema.parse(payload)

export const OrderShippingSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  nama: z.string().nullable(),
  telepon: z.string().nullable(),
  alamat: z.string().nullable(),
  kota: z.string().nullable(),
  kode_pos: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type OrderShippingResponse = z.infer<typeof OrderShippingSchema>

export const validateOrderShippingResponse = (payload: unknown): OrderShippingResponse => 
  OrderShippingSchema.parse(payload)

export const PaymentAmountSchema = z.object({
  id: z.number(),
  payment_id: z.number(),
  currency_code: z.string(),
  amount_minor: z.number(),
  fee_minor: z.number(),
  net_amount_minor: z.number(),
  refund_amount_minor: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PaymentAmountResponse = z.infer<typeof PaymentAmountSchema>

export const validatePaymentAmountResponse = (payload: unknown): PaymentAmountResponse => 
  PaymentAmountSchema.parse(payload)

export const PaymentDetailSchema = z.object({
  id: z.number(),
  payment_id: z.number(),
  detail: z.string().nullable(),
  payload_hash: z.string().nullable(),
  payload_received_at: z.unknown().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PaymentDetailResponse = z.infer<typeof PaymentDetailSchema>

export const validatePaymentDetailResponse = (payload: unknown): PaymentDetailResponse => 
  PaymentDetailSchema.parse(payload)

export const PaymentGatewaySchema = z.object({
  id: z.number(),
  payment_id: z.number(),
  provider: z.string().nullable(),
  provider_txn_id: z.string().nullable(),
  idempotency_key: z.string().nullable(),
  gateway_status: z.string().nullable(),
  gateway_code: z.string().nullable(),
  gateway_message: z.string().nullable(),
  authorized_at: z.unknown().nullable(),
  captured_at: z.unknown().nullable(),
  failed_at: z.unknown().nullable(),
  refunded_at: z.unknown().nullable(),
  reconciled_at: z.unknown().nullable(),
  reconciliation_batch_id: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PaymentGatewayResponse = z.infer<typeof PaymentGatewaySchema>

export const validatePaymentGatewayResponse = (payload: unknown): PaymentGatewayResponse => 
  PaymentGatewaySchema.parse(payload)

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

export const ProdukItemFrontendSchema = z.object({
  id: z.number(),
  produk_item_id: z.number(),
  gambar: z.string().nullable(),
  rating: z.number(),
  jumlah_review: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type ProdukItemFrontendResponse = z.infer<typeof ProdukItemFrontendSchema>

export const validateProdukItemFrontendResponse = (payload: unknown): ProdukItemFrontendResponse => 
  ProdukItemFrontendSchema.parse(payload)

export const PromoCodeSchema = z.object({
  id: z.number(),
  code: z.string(),
  discount_type: z.string(),
  discount_value: z.number(),
  max_discount_minor: z.number().nullable(),
  min_order_minor: z.number(),
  usage_limit: z.number().nullable(),
  used_count: z.number(),
  is_active: z.boolean(),
  starts_at: z.unknown().nullable(),
  ends_at: z.unknown().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type PromoCodeResponse = z.infer<typeof PromoCodeSchema>

export const validatePromoCodeResponse = (payload: unknown): PromoCodeResponse => 
  PromoCodeSchema.parse(payload)

export const SocialAccountSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  provider: z.string(),
  provider_user_id: z.string(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type SocialAccountResponse = z.infer<typeof SocialAccountSchema>

export const validateSocialAccountResponse = (payload: unknown): SocialAccountResponse => 
  SocialAccountSchema.parse(payload)

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type UserResponse = z.infer<typeof UserSchema>

export const validateUserResponse = (payload: unknown): UserResponse => 
  UserSchema.parse(payload)

export const WishlistSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  produk_item_id: z.number(),
  created_at: z.unknown().nullable(),
  updated_at: z.unknown().nullable(),
})

export type WishlistResponse = z.infer<typeof WishlistSchema>

export const validateWishlistResponse = (payload: unknown): WishlistResponse => 
  WishlistSchema.parse(payload)

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

export const ProdukItemsResponseSchema = z.object({
  data: z.array(ProdukItemSchema)
})

export const validateProdukItemCollectionResponse = (payload: unknown) =>
  ProdukItemsResponseSchema.parse(payload)

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

export const CategorysResponseSchema = z.object({
  data: z.array(CategorySchema)
})

export const validateCategoryCollectionResponse = (payload: unknown) =>
  CategorysResponseSchema.parse(payload)

export const OrderAmountsResponseSchema = z.object({
  data: z.array(OrderAmountSchema)
})

export const validateOrderAmountCollectionResponse = (payload: unknown) =>
  OrderAmountsResponseSchema.parse(payload)

export const OrderDetailsResponseSchema = z.object({
  data: z.array(OrderDetailSchema)
})

export const validateOrderDetailCollectionResponse = (payload: unknown) =>
  OrderDetailsResponseSchema.parse(payload)

export const OrderFinancialsResponseSchema = z.object({
  data: z.array(OrderFinancialSchema)
})

export const validateOrderFinancialCollectionResponse = (payload: unknown) =>
  OrderFinancialsResponseSchema.parse(payload)

export const OrderFulfillmentsResponseSchema = z.object({
  data: z.array(OrderFulfillmentSchema)
})

export const validateOrderFulfillmentCollectionResponse = (payload: unknown) =>
  OrderFulfillmentsResponseSchema.parse(payload)

export const OrderPromotionsResponseSchema = z.object({
  data: z.array(OrderPromotionSchema)
})

export const validateOrderPromotionCollectionResponse = (payload: unknown) =>
  OrderPromotionsResponseSchema.parse(payload)

export const OrderShippingsResponseSchema = z.object({
  data: z.array(OrderShippingSchema)
})

export const validateOrderShippingCollectionResponse = (payload: unknown) =>
  OrderShippingsResponseSchema.parse(payload)

export const PaymentAmountsResponseSchema = z.object({
  data: z.array(PaymentAmountSchema)
})

export const validatePaymentAmountCollectionResponse = (payload: unknown) =>
  PaymentAmountsResponseSchema.parse(payload)

export const PaymentDetailsResponseSchema = z.object({
  data: z.array(PaymentDetailSchema)
})

export const validatePaymentDetailCollectionResponse = (payload: unknown) =>
  PaymentDetailsResponseSchema.parse(payload)

export const PaymentGatewaysResponseSchema = z.object({
  data: z.array(PaymentGatewaySchema)
})

export const validatePaymentGatewayCollectionResponse = (payload: unknown) =>
  PaymentGatewaysResponseSchema.parse(payload)

export const ProductReviewsResponseSchema = z.object({
  data: z.array(ProductReviewSchema)
})

export const validateProductReviewCollectionResponse = (payload: unknown) =>
  ProductReviewsResponseSchema.parse(payload)

export const ProdukItemFrontendsResponseSchema = z.object({
  data: z.array(ProdukItemFrontendSchema)
})

export const validateProdukItemFrontendCollectionResponse = (payload: unknown) =>
  ProdukItemFrontendsResponseSchema.parse(payload)

export const PromoCodesResponseSchema = z.object({
  data: z.array(PromoCodeSchema)
})

export const validatePromoCodeCollectionResponse = (payload: unknown) =>
  PromoCodesResponseSchema.parse(payload)

export const SocialAccountsResponseSchema = z.object({
  data: z.array(SocialAccountSchema)
})

export const validateSocialAccountCollectionResponse = (payload: unknown) =>
  SocialAccountsResponseSchema.parse(payload)

export const UsersResponseSchema = z.object({
  data: z.array(UserSchema)
})

export const validateUserCollectionResponse = (payload: unknown) =>
  UsersResponseSchema.parse(payload)

export const WishlistsResponseSchema = z.object({
  data: z.array(WishlistSchema)
})

export const validateWishlistCollectionResponse = (payload: unknown) =>
  WishlistsResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend
