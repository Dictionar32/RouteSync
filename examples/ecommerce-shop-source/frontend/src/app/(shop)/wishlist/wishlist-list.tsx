"use client"

import Link from "next/link"
import { Trash2, ShoppingCart } from "lucide-react"
import { formatPrice } from "@/lib/utils-frontend"
import type * as Types from "@/api/types"
import {
  GridContainer, CardContainer, CardImageArea, CardImage, RemoveBtn,
  CardContentArea, CatText, ProductName, RatingWrapper, StarsBox, StarIcon, RatingCount, PriceText, ProductLinkBtn
} from "./wishlist.styles"
interface WishlistListProps {
  items: Types.ProdukItemResourceTransformed[]
  onRemove: (produkItemId: number) => void
  isRemoving: boolean
}

export function WishlistList({ items, onRemove, isRemoving }: WishlistListProps) {
  return (
    <GridContainer>
      {items.map((item) => (
        <CardContainer key={item.id}>
          {/* Image */}
          <CardImageArea>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <CardImage
              src={item.imageUrl}
              alt={item.nama}
              onError={(e: any) => {
                (e.target as HTMLImageElement).src = `https://placehold.co/300x300/1a1813/504940?text=${encodeURIComponent(item.nama?.charAt(0) || "?")}`
              }}
            />
            <RemoveBtn
              onClick={() => onRemove(item.id)}
              disabled={isRemoving}
            >
              <Trash2 size={14} />
            </RemoveBtn>
          </CardImageArea>

          {/* Content */}
          <CardContentArea>
            <CatText>{item.categoryName}</CatText>
            <ProductName>{item.nama}</ProductName>

            {/* Rating */}
            {(item.reviewCount ?? 0) > 0 && (
              <RatingWrapper>
                <StarsBox>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={11}
                      active={star <= Math.round(item.rating ?? 0) ? "true" : "false"}
                      fill="currentColor"
                    />
                  ))}
                </StarsBox>
                <RatingCount>({item.reviewCount})</RatingCount>
              </RatingWrapper>
            )}

            <PriceText>{formatPrice(item.harga)}</PriceText>

            <ProductLinkBtn href={`/produk/${item.id}`}>
              <ShoppingCart size={13} /> Lihat Produk
            </ProductLinkBtn>
          </CardContentArea>
        </CardContainer>
      ))}
    </GridContainer>
  )
}

export default WishlistList
