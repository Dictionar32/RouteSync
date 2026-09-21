"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useWishlist, useCart } from "@/api/hooks";
import { useCartUiStore } from "@/lib/stores/cart-ui-store";
import useAuthStore from "@/lib/stores/auth-store";
import { ProdukIndex } from "@/features/produk/types/produk-read";
import { formatPrice } from "@/lib/utils-frontend"

interface ProdukCardProps {
  item: ProdukIndex;
  isInWishlist?: boolean;
}

export function ProdukCard({ item, isInWishlist = false }: ProdukCardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const cart = useCart();
  const { openCart } = useCartUiStore();
  const addToWishlist = useWishlist.useCreate();
  const removeFromWishlist = useWishlist.useDelete();

  const isOutOfStock = item.stok === 0;

  useEffect(() => {
    return cart.on("add:success", () => {
      openCart();
    });
  }, [cart, openCart]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (!isAuthenticated) {
      toast.error("Masuk terlebih dahulu untuk menambahkan ke keranjang");
      return;
    }

    if (item.firstItemId === undefined) {
      toast.error("Produk tidak tersedia");
      return;
    }

    cart.items.add(String(item.firstItemId));
  };

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Masuk untuk menambahkan ke wishlist");
      return;
    }
    if (item.firstItemId === undefined) {
      toast.error("Produk tidak tersedia");
      return;
    }

    if (isInWishlist) {
      removeFromWishlist.mutate(item.firstItemId);
    } else {
      addToWishlist.mutate({ produkItemId: String(item.firstItemId) });
    }
  };

  const ratingDisplay = Math.round(item.rating ?? 0);

  return (
    <Link href={`/produk/${item.id}`} className="group block h-full">
      <div className="border border-obsidian-800/60 bg-obsidian-900/30 rounded-sm overflow-hidden hover:border-gold-800/50 hover:shadow-[0_4px_24px_rgba(212,168,67,0.08)] transition-all duration-300 flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-square bg-obsidian-800 overflow-hidden">
          {item.gambarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.gambarUrl}
              alt={item.nama}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart size={32} className="text-obsidian-600" />
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-sm flex items-center justify-center transition-colors ${
              isInWishlist
                ? "bg-gold-500/20 text-gold-400 border border-gold-700/50"
                : "bg-obsidian-900/80 text-obsidian-400 border border-obsidian-700/50 hover:text-gold-400"
            }`}
          >
            <Heart size={14} fill={isInWishlist ? "currentColor" : "none"} />
          </button>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-obsidian-950/80 flex items-center justify-center">
              <span className="text-xs font-semibold text-red-400 border border-red-800/60 bg-red-900/30 px-3 py-1 rounded-sm">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Category */}
          <p className="text-xs text-obsidian-600 mb-1.5">{item.categoryNama}</p>

          {/* Name */}
          <h3 className="text-sm text-obsidian-200 font-medium line-clamp-2 flex-1 mb-2 min-h-10 group-hover:text-gold-400 transition-colors">
            {item.nama}
          </h3>

          {/* Rating */}
          {(item.reviewCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={11}
                    className={star <= ratingDisplay ? "star-filled" : "star-empty"}
                    fill="currentColor"
                  />
                ))}
              </div>
              <span className="text-xs text-obsidian-600">({item.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <p className="text-gold-400 font-semibold font-heading text-base mb-3">
            {formatPrice(item.harga)}
          </p>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || cart.items.createMut.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide uppercase
                       bg-obsidian-800/80 text-obsidian-300 border border-obsidian-700
                       hover:bg-gold-500 hover:text-obsidian-950 hover:border-gold-500
                       active:scale-[0.98]
                       transition-all duration-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={13} />
            {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProdukCard;
