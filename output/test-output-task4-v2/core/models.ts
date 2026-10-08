// Auto-generated. Do not edit.

export interface Category {
  id: number
  nama: string
  createdAt: string | null
  updatedAt: string | null
}

export interface Order {
  id: number
  userId: number
  totalHarga: number
  status: 'pending' | 'paid' | 'canceled'
  orderNumber: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface OrderAmount {
  id: number
  orderId: number
  subtotalMinor: number
  shippingMinor: number
  discountMinor: number
  taxMinor: number
  totalMinor: number
  createdAt: string | null
  updatedAt: string | null
}

export interface OrderDetail {
  id: number
  orderId: number
  produkItemId: number
  qty: number
  harga: number
  createdAt: string | null
  updatedAt: string | null
  banana: string | null
  potato: number | null
  flyingDog: boolean | null
}

export interface OrderFinancial {
  id: number
  orderId: number
  financialStatus: string
  refundedAt: string | null
  refundReason: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface OrderFulfillment {
  id: number
  orderId: number
  fulfillmentStatus: string
  processingAt: string | null
  shippedAt: string | null
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface OrderPromotion {
  id: number
  orderId: number
  promoCodeId: number | null
  promoCode: string
  discountMinor: number
  metadata: Record<string, unknown> | null
  createdAt: string | null
  updatedAt: string | null
}

export interface OrderShipping {
  id: number
  orderId: number
  nama: string | null
  telepon: string | null
  alamat: string | null
  kota: string | null
  kodePos: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface Payment {
  id: number
  orderId: number
  metode: string | null
  status: 'pending' | 'success' | 'failed'
  paidAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PaymentAmount {
  id: number
  paymentId: number
  currencyCode: string
  amountMinor: number
  feeMinor: number
  netAmountMinor: number
  refundAmountMinor: number
  createdAt: string | null
  updatedAt: string | null
}

export interface PaymentDetail {
  id: number
  paymentId: number
  detail: Record<string, unknown> | null
  payloadHash: string | null
  payloadReceivedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface PaymentGateway {
  id: number
  paymentId: number
  provider: string | null
  providerTxnId: string | null
  idempotencyKey: string | null
  gatewayStatus: string | null
  gatewayCode: string | null
  gatewayMessage: string | null
  authorizedAt: string | null
  capturedAt: string | null
  failedAt: string | null
  refundedAt: string | null
  reconciledAt: string | null
  reconciliationBatchId: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ProductReview {
  id: number
  produkItemId: number
  userId: number
  rating: number
  title: string | null
  comment: string | null
  isVerifiedPurchase: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface ProdukItem {
  id: number
  nama: string
  deskripsi: string | null
  categoryId: number | null
  harga: number
  stok: number
  createdAt: string | null
  updatedAt: string | null
  image: unknown // appended attribute
  imageUrl: unknown // appended attribute
  categoryName: unknown // appended attribute
  rating: unknown // appended attribute
  reviewCount: unknown // appended attribute
}

export interface ProdukItemFrontend {
  id: number
  produkItemId: number
  gambar: string | null
  rating: number
  jumlahReview: number
  createdAt: string | null
  updatedAt: string | null
}

export interface PromoCode {
  id: number
  code: string
  discountType: string
  discountValue: number
  maxDiscountMinor: number | null
  minOrderMinor: number
  usageLimit: number | null
  usedCount: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SocialAccount {
  id: number
  userId: number
  provider: string
  providerUserId: string
  email: string | null
  avatarUrl: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: 'admin' | 'user'
  createdAt: string | null
  updatedAt: string | null
}

export interface Wishlist {
  id: number
  userId: number
  produkItemId: number
  createdAt: string | null
  updatedAt: string | null
}

export interface RegisterResponse {
  success: boolean
  message: string
  data: unknown | null
}
