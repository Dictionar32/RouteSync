// Satu item produk di order/promo
export interface PromoItem {
  produkItemId: number;
  produkId: number;
  produkNama: string;
  produkGambar: string;
  produkImageUrl: string;
  qty: number;
  harga: number;
  subtotal: number;
}

// Detail order/promo
export type PromoDetail = {
  id: number;
  status: string;
  invoiceNumber: string | null;

  paymentStatus: string;
  financialStatus: string;
  fulfillmentStatus: string;

  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  taxMinor: number;
  totalHargaMinor: number;

  items: PromoItem[];

  promoCode: string | null;
  promoDiscountMinor: number | null;

  shippingNama: string;
  shippingTelepon: string;
  shippingAlamat: string;
  shippingKota: string;
  shippingKodePos: string;

  createdAt: string;
}

export type PromoIndex = PromoDetail;
export type PromoShow = PromoDetail;