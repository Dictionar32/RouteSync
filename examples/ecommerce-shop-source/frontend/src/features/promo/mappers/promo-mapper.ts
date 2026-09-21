import type { PromoShow, PromoIndex } from "../types/promo-read";
import type { PromoApiResponse, PromoApiCreate } from "../contracts/api-contract";
import { PromoApiField } from "../contracts/api-field";
import { PromoFormValues } from "../contracts/api-schema";

export const toApiRead  = (api: PromoApiResponse): PromoShow => {
    return {
        id: api.id,
        promoCode: api.promotion.code,
        promoDiscountMinor: api.promotion.discount_minor,
        createdAt: api.created_at,
        
        status: api.status,
        totalHargaMinor: api.total_harga_minor,
        invoiceNumber: api.invoice_number,
        paymentStatus: api.payment_status,
        financialStatus: api.financial_status,
        fulfillmentStatus: api.fulfillment_status,
        subtotalMinor: api.subtotal_minor,
        discountMinor: api.discount_minor,
        shippingMinor: api.shipping_minor,
        taxMinor: api.tax_minor,

        shippingAlamat: api.shipping.alamat,
        shippingKota: api.shipping.kota,
        shippingKodePos: api.shipping.kode_pos,
        shippingNama: api.shipping.nama,
        shippingTelepon: api.shipping.telepon,

        items: api.items.map(item => ({
            produkId: item.produk.id,
            produkItemId: item.produk_item_id,
            produkNama: item.produk.nama,
            produkGambar: item.produk.gambar,
            produkImageUrl: item.produk.image_url,
            qty: item.qty,
            harga: item.harga,
            subtotal: item.subtotal,
        })),
    }
}

export const toApiReadList = (api: PromoApiResponse[]): PromoIndex[] => {
    return api.map(toApiRead);
}

export const toApiCreate = (form: PromoFormValues['Create']): PromoApiCreate => {
    return {
        [PromoApiField.CODE]: form.code,
    }
}