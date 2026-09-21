export interface OrderDetailResourceTransformed {
  id: string;
  produkItemId: string;
  produkId: string;
  produkNama: string;
  produkGambar: string;
  produkImageUrl: string;
  qty: string;
  harga: string;
  subtotal: string;
}

export type OrderDetailResourceShow = OrderDetailResourceTransformed;
export type OrderDetailResourceIndex = Array<OrderDetailResourceTransformed>;

export interface OrderResourceTransformed {
  id: string;
  status: string;
  totalHarga: string;
  invoiceNumber: string;
  paymentStatus: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  subtotalMinor: string;
  discountMinor: string;
  shippingMinor: string;
  taxMinor: string;
  totalHargaMinor: string;
  items: Array<OrderDetailResourceTransformed>;
  promotionCode: string | null;
  promotionDiscountMinor: string;
  shippingNama: string | null;
  shippingTelepon: string | null;
  shippingAlamat: string | null;
  shippingKota: string | null;
  shippingKodePos: string | null;
  createdAt: string;
}

export type OrderResourceShow = OrderResourceTransformed;
export type OrderResourceIndex = Array<OrderResourceTransformed>;

export interface PaymentResourceTransformed {
  id: string;
  orderId: string;
  invoiceNumber: string;
  metode: string;
  detail: string;
  status: string;
  paidAt: string;
  provider: string;
  providerTxnId: string;
  gatewayStatus: string;
  amountMinor: string;
  refundAmountMinor: string;
  items: Array<OrderDetailResourceTransformed>;
  promotionCode: string | null;
  promotionDiscountMinor: string;
  gatewayName: string | null;
  gatewayOrderId: string | null;
  gatewayToken: string | null;
  gatewayRedirectUrl: string | null;
  totalHarga: string;
}

export type PaymentResourceShow = PaymentResourceTransformed;
export type PaymentResourceIndex = Array<PaymentResourceTransformed>;

export interface ProdukItemResourceTransformed {
  id: string;
  nama: string;
  deskripsi: string;
  image: string;
  imageUrl: string;
  categoryId: string;
  categoryName: string | null;
  harga: string;
  stok: string;
  rating: string;
  reviewCount: string;
}

export type ProdukItemResourceShow = ProdukItemResourceTransformed;
export type ProdukItemResourceIndex = Array<ProdukItemResourceTransformed>;

export interface RegisterTransformed {
  success: boolean;
  message: string;
  data: string | null;
}

export type RegisterShow = RegisterTransformed;
export type RegisterIndex = Array<RegisterTransformed>;

export interface LoginTransformed {
  success: boolean;
  message: string;
  dataToken: string;
  dataUserId: number;
  dataUserName: string;
  dataUserEmail: string;
  dataUserRole: string;
  dataUserCreatedAt: string | null;
  dataUserUpdatedAt: string | null;
}

export type LoginShow = LoginTransformed;
export type LoginIndex = Array<LoginTransformed>;

export interface OauthRedirectTransformed {
  provider: string;
  authUrl: string;
}

export type OauthRedirectShow = OauthRedirectTransformed;
export type OauthRedirectIndex = Array<OauthRedirectTransformed>;

export interface OauthCallbackTransformed {
  message: string;
  error: string;
}

export type OauthCallbackShow = OauthCallbackTransformed;
export type OauthCallbackIndex = Array<OauthCallbackTransformed>;

export interface SocialLoginTransformed {
  token: string;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  userCreatedAt: string | null;
  userUpdatedAt: string | null;
}

export type SocialLoginShow = SocialLoginTransformed;
export type SocialLoginIndex = Array<SocialLoginTransformed>;

export interface ForgotPasswordTransformed {
  email: string;
  token: string;
  password: string;
}

export type ForgotPasswordShow = ForgotPasswordTransformed;
export type ForgotPasswordIndex = Array<ForgotPasswordTransformed>;

export interface ResetPasswordTransformed {
  message: string;
}

export type ResetPasswordShow = ResetPasswordTransformed;
export type ResetPasswordIndex = Array<ResetPasswordTransformed>;

export interface CategoriesTransformed {
  data: string;
}

export type CategoriesShow = CategoriesTransformed;
export type CategoriesIndex = Array<CategoriesTransformed>;

export interface ProdukTransformed {
  data: Array<ProdukItemResourceTransformed>;
}

export type ProdukShow = ProdukTransformed;
export type ProdukIndex = Array<ProdukTransformed>;

export interface ProdukReviewsTransformed {
  summaryAvgRating: number;
  summaryTotalReview: number;
  reviews: string;
}

export type ProdukReviewsShow = ProdukReviewsTransformed;
export type ProdukReviewsIndex = Array<ProdukReviewsTransformed>;

export interface WebhookTransformed {
  message: string;
}

export type WebhookShow = WebhookTransformed;
export type WebhookIndex = Array<WebhookTransformed>;

export interface ProfileTransformed {
  id: number;
  name: string;
  email: string;
}

export type ProfileShow = ProfileTransformed;
export type ProfileIndex = Array<ProfileTransformed>;

export interface OrdersTransformed {
  data: Array<OrderResourceTransformed>;
}

export type OrdersShow = OrdersTransformed;
export type OrdersIndex = Array<OrdersTransformed>;

export interface CartTransformed {
  data: Array<OrderResourceTransformed>;
}

export type CartShow = CartTransformed;
export type CartIndex = Array<CartTransformed>;

export interface RemoveItemTransformed {
  message: string;
}

export type RemoveItemShow = RemoveItemTransformed;
export type RemoveItemIndex = Array<RemoveItemTransformed>;

export interface ClearCartTransformed {
  message: string;
}

export type ClearCartShow = ClearCartTransformed;
export type ClearCartIndex = Array<ClearCartTransformed>;

export interface CheckoutTransformed {
  data: Array<OrderResourceTransformed>;
}

export type CheckoutShow = CheckoutTransformed;
export type CheckoutIndex = Array<CheckoutTransformed>;

export interface BuyNowTransformed {
  data: Array<OrderResourceTransformed>;
}

export type BuyNowShow = BuyNowTransformed;
export type BuyNowIndex = Array<BuyNowTransformed>;

export interface KeranjangTransformed {
  message: string;
}

export type KeranjangShow = KeranjangTransformed;
export type KeranjangIndex = Array<KeranjangTransformed>;

export interface WishlistTransformed {
  data: Array<ProdukItemResourceTransformed>;
}

export type WishlistShow = WishlistTransformed;
export type WishlistIndex = Array<WishlistTransformed>;

export interface PaymentTransformed {
  data: Array<PaymentResourceTransformed>;
}

export type PaymentShow = PaymentTransformed;
export type PaymentIndex = Array<PaymentTransformed>;

export interface LogoutTransformed {
  message: string;
}

export type LogoutShow = LogoutTransformed;
export type LogoutIndex = Array<LogoutTransformed>;

export interface CategoryTransformed {
  id: number;
  nama: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type CategoryShow = CategoryTransformed;
export type CategoryIndex = Array<CategoryTransformed>;

export interface OrderTransformed {
  id: number;
  userId: number;
  totalHarga: number;
  status: string;
  orderNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type OrderShow = OrderTransformed;
export type OrderIndex = Array<OrderTransformed>;

export interface OrderAmountTransformed {
  id: number;
  orderId: number;
  subtotalMinor: number;
  shippingMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  createdAt: string | null;
  updatedAt: string | null;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
}

export type OrderAmountShow = OrderAmountTransformed;
export type OrderAmountIndex = Array<OrderAmountTransformed>;

export interface OrderDetailTransformed {
  id: number;
  orderId: number;
  produkItemId: number;
  qty: number;
  harga: number;
  createdAt: string | null;
  updatedAt: string | null;
  banana: string | null;
  potato: number | null;
  flyingDog: boolean | null;
  0: string;
}

export type OrderDetailShow = OrderDetailTransformed;
export type OrderDetailIndex = Array<OrderDetailTransformed>;

export interface OrderFinancialTransformed {
  id: number;
  orderId: number;
  financialStatus: string;
  refundedAt: string | null;
  refundReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type OrderFinancialShow = OrderFinancialTransformed;
export type OrderFinancialIndex = Array<OrderFinancialTransformed>;

export interface OrderFulfillmentTransformed {
  id: number;
  orderId: number;
  fulfillmentStatus: string;
  processingAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  cancelReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type OrderFulfillmentShow = OrderFulfillmentTransformed;
export type OrderFulfillmentIndex = Array<OrderFulfillmentTransformed>;

export interface OrderPromotionTransformed {
  id: number;
  orderId: number;
  promoCodeId: number | null;
  promoCode: string;
  discountMinor: number;
  metadata: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type OrderPromotionShow = OrderPromotionTransformed;
export type OrderPromotionIndex = Array<OrderPromotionTransformed>;

export interface OrderShippingTransformed {
  id: number;
  orderId: number;
  nama: string | null;
  telepon: string | null;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type OrderShippingShow = OrderShippingTransformed;
export type OrderShippingIndex = Array<OrderShippingTransformed>;

export interface PaymentAmountTransformed {
  id: number;
  paymentId: number;
  currencyCode: string;
  amountMinor: number;
  feeMinor: number;
  netAmountMinor: number;
  refundAmountMinor: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PaymentAmountShow = PaymentAmountTransformed;
export type PaymentAmountIndex = Array<PaymentAmountTransformed>;

export interface PaymentDetailTransformed {
  id: number;
  paymentId: number;
  detail: string | null;
  payloadHash: string | null;
  payloadReceivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PaymentDetailShow = PaymentDetailTransformed;
export type PaymentDetailIndex = Array<PaymentDetailTransformed>;

export interface PaymentGatewayTransformed {
  id: number;
  paymentId: number;
  provider: string | null;
  providerTxnId: string | null;
  idempotencyKey: string | null;
  gatewayStatus: string | null;
  gatewayCode: string | null;
  gatewayMessage: string | null;
  authorizedAt: string | null;
  capturedAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  reconciledAt: string | null;
  reconciliationBatchId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PaymentGatewayShow = PaymentGatewayTransformed;
export type PaymentGatewayIndex = Array<PaymentGatewayTransformed>;

export interface ProductReviewTransformed {
  id: number;
  produkItemId: number;
  userId: number;
  rating: string;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProductReviewShow = ProductReviewTransformed;
export type ProductReviewIndex = Array<ProductReviewTransformed>;

export interface ProdukItemTransformed {
  id: number;
  nama: string;
  deskripsi: string | null;
  categoryId: number | null;
  harga: number;
  stok: number;
  createdAt: string | null;
  updatedAt: string | null;
  image: string;
  imageUrl: string;
  categoryName: string;
  rating: string;
  reviewCount: string;
}

export type ProdukItemShow = ProdukItemTransformed;
export type ProdukItemIndex = Array<ProdukItemTransformed>;

export interface ProdukItemFrontendTransformed {
  id: number;
  produkItemId: number;
  gambar: string | null;
  rating: number;
  jumlahReview: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export type ProdukItemFrontendShow = ProdukItemFrontendTransformed;
export type ProdukItemFrontendIndex = Array<ProdukItemFrontendTransformed>;

export interface PromoCodeTransformed {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountMinor: number | null;
  minOrderMinor: number;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type PromoCodeShow = PromoCodeTransformed;
export type PromoCodeIndex = Array<PromoCodeTransformed>;

export interface SocialAccountTransformed {
  id: number;
  userId: number;
  provider: string;
  providerUserId: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type SocialAccountShow = SocialAccountTransformed;
export type SocialAccountIndex = Array<SocialAccountTransformed>;

export interface UserTransformed {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export type UserShow = UserTransformed;
export type UserIndex = Array<UserTransformed>;