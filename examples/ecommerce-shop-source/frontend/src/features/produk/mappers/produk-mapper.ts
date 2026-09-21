import { ApiResponseTransformed, ProdukIndex } from "../types/produk-read";
import { ProdukFormValues } from "../contracts/api-schema";
import { ProdukApiResponse, ProdukApiCreate, ProdukApiUpdate } from "../contracts/api-contract";
import { ProdukApiField } from "../contracts/api-field";
import { ProdukForm } from "../types/produk-form";

export const toApiRead = (api: ProdukApiResponse): ApiResponseTransformed => {
    return {
        id: api.id,
        nama: api.name,
        description: api.description ?? '',
        gambar: api.image ?? '',
        gambarUrl: api.image_url ?? '',
        categoryId: api.category_id,
        categoryNama: api.category_name ?? '',
        harga: api.price,
        hargaMin: api.price,
        stok: api.stock,
        rating: api.rating,
        reviewCount: api.review_count,
        // ProdukItem.id IS the produk_item_id used by cart & wishlist
        firstItemId: api.first_item_id ?? api.id,
    }
}

export const toApiReadList = (api: ProdukApiResponse[]): ProdukIndex[] => {
    return api.map(toApiRead);
}

export function toApiCreate(form: ProdukForm['Create']): ProdukApiCreate {
    return {
        [ProdukApiField.NAMA_PRODUK]: form.nama,
        [ProdukApiField.DESKRIPSI]: form.deskripsi,
        [ProdukApiField.HARGA]: form.harga,
        [ProdukApiField.STOK]: form.stok,
        [ProdukApiField.CATEGORY_ID]: form.categoryId,
        [ProdukApiField.GAMBAR]: <string><unknown>form.gambar,
    }
}

export const toApiUpdate = (form: ProdukForm['Update']): ProdukApiUpdate => ({
    [ProdukApiField.NAMA_PRODUK]: form.nama,
    [ProdukApiField.DESKRIPSI]: form.deskripsi,
    [ProdukApiField.HARGA]: form.harga,
    [ProdukApiField.STOK]: form.stok,
    [ProdukApiField.CATEGORY_ID]: form.categoryId,
    [ProdukApiField.GAMBAR]: <string><unknown>form.gambar,
})
