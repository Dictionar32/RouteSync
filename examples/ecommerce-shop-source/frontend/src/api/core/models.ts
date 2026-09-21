// Auto-generated TypeScript Eloquent Models. Do not edit manually.

export interface Category {
  id: number
  nama: string
  createdAt: string | null
  updatedAt: string | null
  produkItems?: ProdukItem[]
}

export interface Order {
  id: number
  userId: number
  totalHarga: number
  status: 'pending' | 'paid' | 'canceled'
  orderNumber: string | null
  createdAt: string | null
  updatedAt: string | null
  user?: User
  details?: OrderDetail[]
  payment?: Payment
  shipping?: OrderShipping
  promotion?: OrderPromotion
  amount?: OrderAmount
  financial?: OrderFinancial
  fulfillment?: OrderFulfillment
}

export interface OrderAmount {
  id: number
  orderId: number
  orderId: string
  subtotalMinor: number
  shippingMinor: number
  discountMinor: number
  taxMinor: number
  totalMinor: number
  createdAt: string | null
  updatedAt: string | null
  orderId: string
  createdAt: string
  order?: Order
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
  order?: Order
  produkItem?: ProdukItem
}

export interface OrderFinancial {
  id: number
  orderId: number
  orderId: string
  financialStatus: 'pending' | 'paid' | 'partially_refunded' | 'refunded' | 'failed' | 'cancelled'
  refundedAt: string | null
  refundReason: string | null
  createdAt: string | null
  updatedAt: string | null
  orderId: string
  financialStatus: string
  createdAt: string
  order?: Order
}

export interface OrderFulfillment {
  id: number
  orderId: number
  orderId: string
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'returned'
  processingAt: string | null
  shippedAt: string | null
  completedAt: string | null
  canceledAt: string | null
  cancelReason: string | null
  createdAt: string | null
  updatedAt: string | null
  orderId: string
  fulfillmentStatus: string
  createdAt: string
  order?: Order
}

export interface OrderPromotion {
  id: number
  orderId: number
  promoCodeId: number | null
  promoCode: string
  discountMinor: number
  metadata: string | null
  createdAt: string | null
  updatedAt: string | null
  orderId: string
  order?: Order
  promoCode?: PromoCode
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
  order?: Order
}

export interface Payment {
  id: number
  orderId: number
  orderId: string
  metode: string | null
  status: 'pending' | 'success' | 'failed'
  paidAt: string | null
  createdAt: string | null
  updatedAt: string | null
  paymentDetail?: PaymentDetail
  order?: Order
  paymentAmount?: PaymentAmount[]
  paymentGateways?: PaymentGateway[]
}

export interface PaymentAmount {
  id: number
  paymentId: number
  paymentId: string
  currencyCode: string
  amountMinor: number
  feeMinor: number
  netAmountMinor: number
  refundAmountMinor: number
  createdAt: string | null
  updatedAt: string | null
  payment?: Payment
}

export interface PaymentDetail {
  id: number
  paymentId: number
  detail: string | null
  payloadHash: string | null
  payloadReceivedAt: string | null
  createdAt: string | null
  updatedAt: string | null
  payment?: Payment
}

export interface PaymentGateway {
  id: number
  paymentId: number
  paymentId: string
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
  payment?: Payment
}

export interface ProductReview {
  id: number
  produkItemId: number
  userId: number
  rating: string
  title: string | null
  comment: string | null
  isVerifiedPurchase: boolean
  createdAt: string | null
  updatedAt: string | null
  produkItem?: ProdukItem
  user?: User
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
  image?: unknown
  imageUrl?: unknown
  categoryName?: unknown
  rating?: unknown
  reviewCount?: unknown
  orderDetails?: OrderDetail[]
  category?: Category
  frontend?: ProdukItemFrontend
  wishlists?: Wishlist[]
  reviews?: ProductReview[]
}

export interface ProdukItemFrontend {
  id: number
  produkItemId: number
  gambar: string | null
  rating: number
  jumlahReview: number
  createdAt: string | null
  updatedAt: string | null
  produkItem?: ProdukItem
}

export interface PromoCode {
  id: number
  code: string
  discountType: 'fixed_minor' | 'percent'
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
  orderPromotions?: OrderPromotion[]
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
  user?: User
}

export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: 'admin' | 'user'
  createdAt: string | null
  updatedAt: string | null
  orders?: Order[]
  wishlists?: Wishlist[]
  socialAccounts?: SocialAccount[]
  productReviews?: ProductReview[]
}

export interface Wishlist {
  id: number
  userId: number
  produkItemId: number
  createdAt: string | null
  updatedAt: string | null
  user?: User
  produkItem?: ProdukItem
}
