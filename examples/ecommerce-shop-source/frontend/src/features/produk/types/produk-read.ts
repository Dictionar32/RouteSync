/**
 * Produk Read Types - API response types for produk feature
 */
export interface ApiResponseTransformed {
  id: number
  nama: string
  description: string
  gambar: string
  gambarUrl: string
  categoryId: number
  categoryNama: string
  harga: number
  hargaMin: number
  stok: number
  rating: number
  reviewCount: number
  firstItemId: number | undefined
}

export type ProdukIndex = ApiResponseTransformed;
export type ProdukShow = ApiResponseTransformed;

//features/produk/types/produk-read.ts
//features/produk/types/produk-form.ts

//features/produk/contracts/api-contract.ts
//features/produk/contracts/api-field.ts
//features/produk/contracts/api-schema.ts

//features/produk/mappers/produk-mapper.ts

//features/produk/services/produk-service.ts

//features/produk/hooks/use-produk.ts