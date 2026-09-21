"use client"

import Link from "next/link"
import { Trash2, Star, ShoppingCart } from "lucide-react"
import { formatPrice } from "@/lib/utils-frontend"
import { WishlistItem } from "@/features/wishlist/types/wishlist-read"

interface WishlistListProps {
  items: WishlistItem[]
  onRemove: (produkItemId: number) => void
  isRemoving: boolean
}

export function WishlistList({ items, onRemove, isRemoving }: WishlistListProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-obsidian-800/60 bg-obsidian-900/20 rounded-sm overflow-hidden hover:border-obsidian-700 transition-colors group"
        >
          {/* Image */}
          <div className="relative aspect-square bg-obsidian-800 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1a1813/504940?text=${encodeURIComponent(item.name.charAt(0))}`
              }}
            />
            <button
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-sm bg-obsidian-900/80 border border-obsidian-700/50 text-obsidian-400 hover:text-red-400 hover:border-red-800/60 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-xs text-obsidian-600 mb-1">{item.categoryName}</p>
            <h3 className="text-sm text-obsidian-200 font-medium line-clamp-2 mb-2 min-h-10">
              {item.name}
            </h3>

            {/* Rating */}
            {item.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={11}
                      className={star <= Math.round(item.rating) ? "star-filled" : "star-empty"}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <span className="text-xs text-obsidian-600">({item.reviewCount})</span>
              </div>
            )}

            <p className="text-gold-400 font-semibold font-heading mb-3">{formatPrice(item.price)}</p>

            <Link
              href={`/produk/${item.id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-obsidian-800 text-obsidian-200 border border-obsidian-700 hover:bg-gold-500 hover:text-obsidian-950 hover:border-gold-500 transition-all rounded-sm"
            >
              <ShoppingCart size={13} /> Lihat Produk
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

export default WishlistList
