export interface WishlistItem {
  id: number
  name: string
  description: string
  image: string
  imageUrl: string
  categoryId: number
  categoryName: string
  price: number
  stock: number
  rating: number
  reviewCount: number
}

export type WishlistIndex = WishlistItem
export type WishlistShow = WishlistItem
