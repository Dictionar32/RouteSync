'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, Trash2, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartUiStore } from '@/lib/stores/cart-ui-store';
import { formatPrice } from '@/lib/utils-frontend';
import type * as Types from '@/api/types';
import { useCart } from '@/api';
import {
  Overlay, Backdrop, Drawer, Header, HeaderTitleArea, Title, CartCountBadge, CloseButton, ContentArea, SkeletonRow, SkeletonImage, SkeletonInfo,
  SkeletonText, SkeletonTextShort, EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateSub,
  StartShoppingBtn, CartItemRow, CartItemImageContainer, CartItemImagePlaceholder,
  CartItemInfo, CartItemName, CartItemPrice, CartItemActions, QtyControls,
  QtyBtn, QtyDisplay, SubtotalArea, SubtotalText, RemoveBtn, Footer,
  AppliedPromoContainer, AppliedPromoInfo, StyledTagIcon, AppliedPromoCode, AppliedPromoDiscount,
  RemovePromoBtn, PromoInputContainer, PromoInput, PromoApplyBtn, TotalsContainer,
  TotalRow, DiscountRow, Divider, GrandTotalRow, GrandTotalValue, CheckoutLink,
  StyledShoppingBag
} from './cart-modal.styles';

export default function CartModal() {
  const { isOpen, closeCart } = useCartUiStore();
  
  // Use SDK-generated hook
  const cartState = useCart();
  const { cart, isLoading } = cartState;

  const [promoInput, setPromoInput] = useState('');

  if (!isOpen) return null;

  const items = cart?.items ?? [];
  const cartCount = items.reduce((s: number, i) => s + i.qty, 0);

  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    cartState.promotions.apply(promoInput.trim()).then(() => setPromoInput(''));
  };

  return (
    <Overlay>
      {/* Backdrop */}
      <Backdrop onClick={closeCart} />

      {/* Drawer */}
      <Drawer style={{ animation: 'slideInRight 0.3s ease forwards' }}>
        {/* Header */}
        <Header>
          <HeaderTitleArea>
            <StyledShoppingBag>
              <ShoppingBag size={20} />
            </StyledShoppingBag>
            <Title>Keranjang</Title>
            {cartCount > 0 && (
              <CartCountBadge>
                {cartCount} item
              </CartCountBadge>
            )}
          </HeaderTitleArea>
          <CloseButton onClick={closeCart}>
            <X size={20} />
          </CloseButton>
        </Header>

        {/* Content */}
        <ContentArea>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i}>
                <SkeletonImage />
                <SkeletonInfo>
                  <SkeletonText />
                  <SkeletonTextShort />
                </SkeletonInfo>
              </SkeletonRow>
            ))
          ) : !cart || items.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <ShoppingBag size={48} />
              </EmptyStateIcon>
              <EmptyStateTitle>Keranjang Kosong</EmptyStateTitle>
              <EmptyStateSub>Tambahkan produk untuk memulai belanja</EmptyStateSub>
              <StartShoppingBtn onClick={closeCart}>
                Mulai Belanja
              </StartShoppingBtn>
            </EmptyState>
          ) : (
            items.map((item) => (
              <CartItemRow key={item.produkItemId}>
                {/* Image */}
                <CartItemImageContainer>
                  {item.produkImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.produkImageUrl}
                      alt={item.produkNama}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <CartItemImagePlaceholder>
                      <ShoppingBag size={20} />
                    </CartItemImagePlaceholder>
                  )}
                </CartItemImageContainer>

                {/* Info */}
                <CartItemInfo>
                  <CartItemName>{item.produkNama}</CartItemName>
                  <CartItemPrice>{formatPrice(item.harga)}</CartItemPrice>

                  <CartItemActions>
                    <QtyControls>
                      <QtyBtn onClick={() => cartState.items.changeQty(String(item.produkItemId), -1)}>
                        <Minus size={12} />
                      </QtyBtn>
                      <QtyDisplay>{item.qty}</QtyDisplay>
                      <QtyBtn onClick={() => cartState.items.changeQty(String(item.produkItemId), 1)}>
                        <Plus size={12} />
                      </QtyBtn>
                    </QtyControls>

                    <SubtotalArea>
                      <SubtotalText>{formatPrice(item.subtotal)}</SubtotalText>
                      <RemoveBtn onClick={() => cartState.items.remove(item.produkItemId)}>
                        <Trash2 size={13} />
                      </RemoveBtn>
                    </SubtotalArea>
                  </CartItemActions>
                </CartItemInfo>
              </CartItemRow>
            ))
          )}
        </ContentArea>

        {/* Footer */}
        {cart && items.length > 0 && (
          <Footer>
            {/* Promo code */}
            {cart.promotionCode ? (
              <AppliedPromoContainer>
                <AppliedPromoInfo>
                  <StyledTagIcon>
                    <Tag size={14} />
                  </StyledTagIcon>
                  <AppliedPromoCode>{cart.promotionCode}</AppliedPromoCode>
                  {cart.promotionDiscountMinor && (
                    <AppliedPromoDiscount>-{formatPrice(cart.promotionDiscountMinor)}</AppliedPromoDiscount>
                  )}
                </AppliedPromoInfo>
                <RemovePromoBtn onClick={cartState.promotions.remove}>
                  <X size={14} />
                </RemovePromoBtn>
              </AppliedPromoContainer>
            ) : (
              <PromoInputContainer>
                <PromoInput
                  value={promoInput}
                  onChange={(e: any) => setPromoInput(e.target.value)}
                  placeholder="Kode promo..."
                  onKeyDown={(e: any) => e.key === 'Enter' && handleApplyPromo()}
                />
                <PromoApplyBtn onClick={handleApplyPromo} disabled={cartState.promotions.applyMut.isPending}>
                  Pakai
                </PromoApplyBtn>
              </PromoInputContainer>
            )}

            {/* Totals */}
            <TotalsContainer>
              <TotalRow>
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotalMinor ?? 0)}</span>
              </TotalRow>
              {(cart.discountMinor ?? 0) > 0 && (
                <DiscountRow>
                  <span>Diskon</span>
                  <span>-{formatPrice(cart.discountMinor ?? 0)}</span>
                </DiscountRow>
              )}
              {(cart.shippingMinor ?? 0) > 0 && (
                <TotalRow>
                  <span>Pengiriman</span>
                  <span>{formatPrice(cart.shippingMinor ?? 0)}</span>
                </TotalRow>
              )}
              <Divider />
              <GrandTotalRow>
                <span>Total</span>
                <GrandTotalValue>{formatPrice(cart.totalHargaMinor ?? 0)}</GrandTotalValue>
              </GrandTotalRow>
            </TotalsContainer>

            <CheckoutLink href="/checkout" onClick={closeCart}>
              Checkout <ArrowRight size={16} />
            </CheckoutLink>
          </Footer>
        )}
      </Drawer>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </Overlay>
  );
}
