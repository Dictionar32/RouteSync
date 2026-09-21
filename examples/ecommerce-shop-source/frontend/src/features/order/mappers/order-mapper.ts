import { OrderShow, OrderIndex } from "../types/order-read";
import { OrderFormValues } from "../contracts/api-schema";
import { OrderApiField } from "../contracts/api-field";
import { OrderApiResponse, OrderApiCreate } from "../contracts/api-contract";

export const toApiRead = (api: OrderApiResponse): OrderShow => {
  return {
    id: api.id,
    status: api.status,
    totalHarga: api.total_harga,
    invoiceNumber: api.invoice_number,
    paymentStatus: api.payment_status,
    financialStatus: api.financial_status,
    fulfillmentStatus: api.fulfillment_status,
    subtotalMinor: api.subtotal_minor,
    discountMinor: api.discount_minor,
    shippingMinor: api.shipping_minor,
    taxMinor: api.tax_minor,
    totalHargaMinor: api.total_harga_minor,

    shippingNama: api.shipping?.nama ?? null,
    shippingTelepon: api.shipping?.telepon ?? null,
    shippingAlamat: api.shipping?.alamat ?? null,
    shippingKota: api.shipping?.kota ?? null,
    shippingKodePos: api.shipping?.kode_pos ?? null,

    promotionCode: api.promotion?.code ?? null,
    promotionDiscount: api.promotion?.discount_minor ?? null,

    createdAt: api.created_at,

    items: api.items.map(item => ({
      produkItemId: item.produk_item_id,
      productId: item.produk.id,
      productName: item.produk.nama,
      productImage: item.produk.gambar ?? '',
      productImageUrl: item.produk.image_url ?? '',
      qty: item.qty,
      price: item.harga,
      subtotal: item.subtotal,
    })),
  }
}

export const toApiReadList = (api: OrderApiResponse[]): OrderIndex[] => {
  return api.map(toApiRead);
}

export const toApiCreate = (form: OrderFormValues['Create']): OrderApiCreate => {
  return {
    [OrderApiField.NAMA]: form.shippingNama,
    [OrderApiField.TELEPON]: form.shippingTelepon ?? "",
    [OrderApiField.ALAMAT]: form.shippingAlamat,
    [OrderApiField.KOTA]: form.shippingKota ?? "",
    [OrderApiField.KODE_POS]: form.shippingKodePos ?? "",
  }
}
