/**
 * Produk Form Types - Form input types for produk feature
 */
export type ProdukForm = {
  Create: {
    nama: string
    deskripsi: string
    harga: number
    stok: number
    categoryId: number
    gambar: File
  }

  Update: {
    nama: string
    deskripsi: string
    harga: number
    stok: number
    kategorId: number
    gambar: File
  }
}
