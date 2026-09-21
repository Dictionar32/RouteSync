"use client";

import { toast } from "sonner";
import useAuthStore from "@/lib/stores/auth-store";
import { useCartUiStore } from "@/lib/stores/cart-ui-store";
import { formatPrice } from "@/lib/utils-frontend";
import { useWishlist, useCartItems } from '@/api/hooks';
import {
  CardLink, CardContainer, CardImageArea, CardImage, IconCartLarge, WishlistBtn, IconHeart,
  CardContentArea, IconStar, CardAddToCartBtn, IconCartSmall
} from "./produk.styles"
import { ProdukItemResourceTransformed } from "@/api/types";

interface ProdukCardProps {
  item: ProdukItemResourceTransformed;
  isInWishlist?: boolean;
}

export function ProdukCard({ item, isInWishlist = false }: ProdukCardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToCart = useCartItems.useCreate();
  const { openCart } = useCartUiStore();
  const addToWishlist = useWishlist.useCreate();
  const removeFromWishlist = useWishlist.useRemove();

  const isOutOfStock = (item.stok ?? 0) === 0;

  const firstItemId = item.id;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    if (!isAuthenticated) {
      toast.error("Masuk terlebih dahulu untuk menambahkan ke keranjang");
      return;
    }

    if (firstItemId === undefined) {
      toast.error("Produk tidak tersedia");
      return;
    }

    addToCart.mutate(
      { produkItemId: String(firstItemId), qty: 1 },
      {
        onSuccess: () => {
          toast.success("Ditambahkan ke keranjang!");
          openCart();
        },
        onError: () => toast.error("Gagal menambahkan ke keranjang"),
      }
    );
  };

  const handleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Masuk untuk menambahkan ke wishlist");
      return;
    }
    if (firstItemId === undefined) {
      toast.error("Produk tidak tersedia");
      return;
    }

    if (isInWishlist) {
      removeFromWishlist.mutate(firstItemId, {
        onSuccess: () => toast.success("Dihapus dari wishlist"),
        onError: () => toast.error("Gagal menghapus dari wishlist"),
      });
    } else {
      addToWishlist.mutate({ produkItemId: String(firstItemId) }, {
        onSuccess: () => toast.success("Ditambahkan ke wishlist!"),
        onError: () => toast.error("Gagal menambahkan ke wishlist"),
      });
    }
  };

  const ratingDisplay = Math.round(item.rating ?? 0);

  return (
    <CardLink href={`/produk/${item.id}`}>
      <CardContainer>
        {/* Image */}
        <CardImageArea>
          {item.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <CardImage src={item.imageUrl} alt={item.nama} />
          ) : (
            <CardImageArea.placeholderBox>
              <IconCartLarge size={32} />
            </CardImageArea.placeholderBox>
          )}

          {/* Wishlist Button */}
          <WishlistBtn
            onClick={handleWishlist}
            active={isInWishlist ? "true" : "false"}
          >
            <IconHeart size={14} fill={isInWishlist ? "currentColor" : "none"} />
          </WishlistBtn>

          {isOutOfStock && (
            <CardImageArea.outOfStockBox>
              <CardImageArea.outOfStockBadge>
                Stok Habis
              </CardImageArea.outOfStockBadge>
            </CardImageArea.outOfStockBox>
          )}
        </CardImageArea>

        {/* Content */}
        <CardContentArea>
          {/* Category */}
          <CardContentArea.category>{item.categoryName}</CardContentArea.category>

          {/* Name */}
          <CardContentArea.name>
            {item.nama}
          </CardContentArea.name>

          {/* Rating */}
          {(item.reviewCount ?? 0) > 0 && (
            <CardContentArea.ratingRow>
              <CardContentArea.starsWrap>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconStar
                    key={star}
                    size={11}
                    active={star <= ratingDisplay ? "true" : "false"}
                    fill="currentColor"
                  />
                ))}
              </CardContentArea.starsWrap>
              <CardContentArea.reviewCount>({item.reviewCount})</CardContentArea.reviewCount>
            </CardContentArea.ratingRow>
          )}

          {/* Price */}
          <CardContentArea.price>{formatPrice(item.harga)}</CardContentArea.price>

          {/* Add to Cart */}
          <CardAddToCartBtn
            onClick={handleAddToCart}
            disabled={isOutOfStock || addToCart.isPending}
          >
            <IconCartSmall size={13} />
            {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
          </CardAddToCartBtn>
        </CardContentArea>
      </CardContainer>
    </CardLink>
  );
}

export default ProdukCard;
