"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, Plus, Minus, Tag, X, ArrowRight, Loader2, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthGuard, SectionHeader } from "@/components/shared"

import {
  PageContainer, ContentWrapper, GridContainer,
  EmptyState, ItemsList, CartItemCard, SummaryColumn, PromoCard, TotalsCard, SkeletonScreen,
  SkelTitle, SkelLine, SkelItem, SkelSummary,
  IconCart, IconPackage, IconTag, IconMinus, IconPlus, IconTrash, IconArrowRight, IconX, IconLoader,
  StyledInput, StyledSeparator, ActionLink, ContinueShoppingLink, CartItemImg,
  QtyBtn, RemoveBtn, RemovePromoBtn, ApplyPromoBtn, CheckoutBtn
} from "./keranjang.styles"

import { useCart } from '@/api'
import useAuthStore from "@/lib/stores/auth-store"
import { formatPrice } from "@/lib/utils-frontend"


export default function KeranjangPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [promoInput, setPromoInput] = useState("")

  const cartState = useCart()
  const { cart, isLoading } = cartState

  const handleQtyChange = (produkItemId: number, currentQty: number, delta: number) => {
    const nextQty = currentQty + delta
    if (nextQty <= 0) {
      handleRemove(produkItemId)
      return
    }
    cartState.items.changeQty(String(produkItemId), delta)
  }

  const handleRemove = (produkItemId: number) => {
    cartState.items.remove(produkItemId)
  }

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return
    cartState.promotions.apply(promoInput.trim()).then(() => setPromoInput(""))
  }

  if (!isAuthenticated) return <AuthGuard icon={ShoppingCart} title="Masuk untuk melihat keranjang" description="Item keranjang tersimpan di akun Anda" />

  if (isLoading) {
    return (
      <SkeletonScreen>
        <SkeletonScreen.content>
          <SkelTitle />
          <SkelLine />
          <SkeletonScreen.grid>
            <SkeletonScreen.itemsCol><SkelItem /><SkelItem /></SkeletonScreen.itemsCol>
            <SkelSummary />
          </SkeletonScreen.grid>
        </SkeletonScreen.content>
      </SkeletonScreen>
    )
  }

  const items = cart?.items ?? [];

  return (
    <PageContainer>
      <ContentWrapper>
        <SectionHeader label="Belanja" title="Keranjang Belanja" />

        {items.length === 0 ? (
          <EmptyState>
            <EmptyState.iconBox>
              <IconCart size={36} />
            </EmptyState.iconBox>
            <EmptyState.textWrapper>
              <EmptyState.title>Keranjang Anda kosong</EmptyState.title>
              <EmptyState.desc>Temukan produk premium pilihan kami</EmptyState.desc>
            </EmptyState.textWrapper>
            <ActionLink href="/produk">Jelajahi Produk</ActionLink>
          </EmptyState>
        ) : (
          <GridContainer>

            {/* Items */}
            <ItemsList>
              {items.map((item) => (
                <CartItemCard key={item.produkItemId}>
                  <CartItemCard.imageWrapper>
                    {item.produkImageUrl
                      ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <CartItemImg src={item.produkImageUrl} alt={item.produkNama} />
                      )
                      : <CartItemCard.placeholder><IconPackage size={24} /></CartItemCard.placeholder>
                    }
                  </CartItemCard.imageWrapper>
                  <CartItemCard.details>
                    <CartItemCard.name>{item.produkNama}</CartItemCard.name>
                    <CartItemCard.price>{formatPrice(item.harga)}</CartItemCard.price>
                    <CartItemCard.actionRow>
                      <CartItemCard.qtyGroup>
                        <QtyBtn variant="ghost" size="icon"
                          disabled={cartState.items.updateMut.isPending || cartState.items.removeMut.isPending}
                          onClick={() => handleQtyChange(item.produkItemId, item.qty, -1)}>
                          <IconMinus size={12} />
                        </QtyBtn>
                        <CartItemCard.qty>{item.qty}</CartItemCard.qty>
                        <QtyBtn variant="ghost" size="icon"
                          disabled={cartState.items.updateMut.isPending || cartState.items.removeMut.isPending}
                          onClick={() => handleQtyChange(item.produkItemId, item.qty, 1)}>
                          <IconPlus size={12} />
                        </QtyBtn>
                      </CartItemCard.qtyGroup>
                      <RemoveBtn variant="ghost" size="icon"
                        disabled={cartState.items.removeMut.isPending}
                        onClick={() => handleRemove(item.produkItemId)}>
                        <IconTrash size={14} />
                      </RemoveBtn>
                    </CartItemCard.actionRow>
                  </CartItemCard.details>
                  <CartItemCard.subtotal>{formatPrice(item.subtotal)}</CartItemCard.subtotal>
                </CartItemCard>
              ))}
            </ItemsList>

            {/* Summary */}
            <SummaryColumn>
              {/* Promo */}
              <PromoCard>
                <PromoCard.headerRow>
                  <IconTag size={14} />
                  <PromoCard.label>Kode Promo</PromoCard.label>
                </PromoCard.headerRow>
                {cart?.promotionCode ? (
                  <PromoCard.appliedWrapper>
                    <PromoCard.code>{cart.promotionCode}</PromoCard.code>
                    <RemovePromoBtn variant="ghost" size="icon"
                      disabled={cartState.promotions.removeMut.isPending}
                      onClick={() => cartState.promotions.remove()}>
                      {cartState.promotions.removeMut.isPending ? <IconLoader size={12} /> : <IconX size={12} />}
                    </RemovePromoBtn>
                  </PromoCard.appliedWrapper>
                ) : (
                  <PromoCard.inputGroup>
                    <StyledInput value={promoInput} onChange={(e: any) => setPromoInput(e.target.value)}
                      onKeyDown={(e: any) => e.key === "Enter" && handleApplyPromo()}
                      placeholder="Kode promo" />
                    <ApplyPromoBtn variant="outline" onClick={handleApplyPromo}
                      disabled={cartState.promotions.applyMut.isPending || !promoInput.trim()}>
                      {cartState.promotions.applyMut.isPending ? <IconLoader size={12} /> : "Pakai"}
                    </ApplyPromoBtn>
                  </PromoCard.inputGroup>
                )}
              </PromoCard>

              {/* Totals */}
              <TotalsCard>
                <TotalsCard.header>Ringkasan</TotalsCard.header>
                <TotalsCard.list>
                  <TotalsCard.row>
                    <TotalsCard.label>Subtotal ({items.length} item)</TotalsCard.label>
                    <TotalsCard.value>{formatPrice(cart?.subtotalMinor ?? 0)}</TotalsCard.value>
                  </TotalsCard.row>
                  {(cart?.discountMinor ?? 0) > 0 && (
                    <TotalsCard.discountRow>
                      <TotalsCard.label>Diskon</TotalsCard.label><TotalsCard.value>-{formatPrice(cart?.discountMinor ?? 0)}</TotalsCard.value>
                    </TotalsCard.discountRow>
                  )}
                  {(cart?.shippingMinor ?? 0) > 0 && (
                    <TotalsCard.row>
                      <TotalsCard.label>Ongkir</TotalsCard.label><TotalsCard.value>{formatPrice(cart?.shippingMinor ?? 0)}</TotalsCard.value>
                    </TotalsCard.row>
                  )}
                </TotalsCard.list>
                <StyledSeparator />
                <TotalsCard.grandTotalWrapper>
                  <TotalsCard.grandLabel>Total</TotalsCard.grandLabel>
                  <TotalsCard.grandValue>{formatPrice(cart?.totalHargaMinor ?? 0)}</TotalsCard.grandValue>
                </TotalsCard.grandTotalWrapper>
                <CheckoutBtn onClick={() => router.push("/checkout")}>
                  Lanjut Checkout <IconArrowRight size={15} />
                </CheckoutBtn>
                <ContinueShoppingLink href="/produk">
                  ← Lanjut Belanja
                </ContinueShoppingLink>
              </TotalsCard>
            </SummaryColumn>
          </GridContainer>
        )}
      </ContentWrapper>
    </PageContainer>
  )
}
