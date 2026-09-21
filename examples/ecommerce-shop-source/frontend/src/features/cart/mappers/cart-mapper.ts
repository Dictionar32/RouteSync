import { CartFormValues } from "../contracts/api-schema";
import { CartShow, CartIndex } from "../types/cart-read";
import { CartApiField } from "../contracts/api-field";
import { CartApiResponse, CartApiItemDetail, CartApiCreate, CartApiUpdate } from "../contracts/api-contract";

// Unwrap items — bisa array langsung atau { data: [...] } dari ResourceCollection
function unwrapItems(items: CartApiResponse['items']): CartApiItemDetail[] {
  if (Array.isArray(items)) return items;
  return items.data;
}

export const toApiRead = (api: CartApiResponse): CartShow => {
  const items = unwrapItems(api.items);
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
    createdAt: api.created_at,

    promotionCode: api.promotion?.code ?? null,
    promotionDiscount: api.promotion?.discount_minor ?? null,

    shippingNama: api.shipping?.nama ?? null,
    shippingTelepon: api.shipping?.telepon ?? null,
    shippingAlamat: api.shipping?.alamat ?? null,
    shippingKota: api.shipping?.kota ?? null,
    shippingKodePos: api.shipping?.kode_pos ?? null,

    items: items.map(item => ({
      id: item.id,
      produkItemId: item.produk_item_id,
      productId: item.produk.id,
      productName: item.produk.nama,
      productImage: item.produk.gambar,
      productImageUrl: item.produk.image_url,
      qty: item.qty,
      price: item.harga,
      subtotal: item.subtotal,
    })),
  }
}

export const toApiReadList = (api: CartApiResponse[]): CartIndex[] => {
  return api.map(toApiRead);
}

export const toApiCreate = (form: CartFormValues['Create']): CartApiCreate => {
  return {
    [CartApiField.PRODUCTITEMID]: form.produkItemId,
    [CartApiField.QTY]: form.qty,
  }
}

export const toApiUpdate = (form: CartFormValues['Update']): CartApiUpdate => {
  return {
    [CartApiField.QTY]: form.qty,
  }
}
