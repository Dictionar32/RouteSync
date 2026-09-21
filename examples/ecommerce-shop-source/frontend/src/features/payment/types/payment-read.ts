export type PaymentItem = {
  id: number;
  produkItemId: number;
  nama: string;
  gambar: string;
  imageUrl: string;
  qty: number;
  harga: number;
  subtotal: number;
};

// Flat Order type, memanggil PaymentItem[]
export type PaymentApiTransformed = {
  // Order info
  id: number;
  orderId: number;
  invoiceNumber: string | null;
  status: 'pending' | 'paid' | 'failed';
  totalHarga: number;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalHargaMinor: number;
  paymentStatus: string;
  financialStatus: string;
  fulfillmentStatus: string;
  createdAt: string;

  // Shipping info (flattened)
  shippingNama: string | null;
  shippingTelepon: string | null;
  shippingAlamat: string | null;
  shippingKota: string | null;
  shippingKodePos: string | null;

  // Promo info (flattened)
  promoCode: string | null;
  promoDiscountMinor: number;

  // Payment info (flattened)
  paymentId: number | null;
  paymentMetode: string | null;
  paymentStatusDetail: string | null;
  paymentPaidAt: string | null;
  paymentProvider: string | null;
  paymentProviderTxnId: string | null;
  paymentGatewayStatus: string | null;
  paymentAmountMinor: number | null;
  paymentRefundAmountMinor: number | null;
  paymentGatewayName: string | null;
  paymentGatewayOrderId: string | null;
  paymentGatewayToken: string | null;
  paymentGatewayRedirectUrl: string | null;

  // Items array
  items: PaymentItem[];
};

export type PaymentIndex = PaymentApiTransformed;
export type PaymentShow = PaymentApiTransformed;