"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ArrowRight, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  PageContainer, ContentWrapper, CardBox, CornerTL, CornerTR, CornerBL, CornerBR, RadialBg,
  InnerContainer, IconBox, Subtitle, Title, Desc, OrderInfoBox, InfoRow, InfoLabel, InvoiceValue, OrderIdValue, StatusBadgeStyle, BtnGroup
} from "./payment-success.styles"

function SuccessContent() {
  const params = useSearchParams()
  const orderId  = params.get("orderId")
  const invoice  = params.get("invoice")
  const status   = params.get("status") ?? "paid"

  return (
    <PageContainer>
      <ContentWrapper>
        <CardBox>
          {/* Corner accents */}
          <CornerTL />
          <CornerTR />
          <CornerBL />
          <CornerBR />

          {/* Radial bg glow */}
          <RadialBg />

          <InnerContainer>
            <IconBox>
              <CheckCircle size={40} className="text-emerald-400" />
            </IconBox>

            <Subtitle>
              Pembayaran Berhasil
            </Subtitle>
            <Title>Terima Kasih!</Title>
            <Desc>
              Pesanan Anda telah dikonfirmasi dan sedang diproses. 
              Kami akan segera mengirimkan ke alamat yang Anda berikan.
            </Desc>

            {/* Order info */}
            <OrderInfoBox>
              {invoice && (
                <InfoRow>
                  <InfoLabel>Nomor Invoice</InfoLabel>
                  <InvoiceValue>{invoice}</InvoiceValue>
                </InfoRow>
              )}
              {orderId && (
                <InfoRow>
                  <InfoLabel>Order ID</InfoLabel>
                  <OrderIdValue>#{orderId}</OrderIdValue>
                </InfoRow>
              )}
              <InfoRow>
                <InfoLabel>Status Pembayaran</InfoLabel>
                <StatusBadgeStyle>{status}</StatusBadgeStyle>
              </InfoRow>
            </OrderInfoBox>

            <Separator className="bg-obsidian-800 mb-6" />

            <BtnGroup>
              <Link href="/orders">
                <Button className="btn-gold w-full flex items-center justify-center gap-2">
                  <ShoppingBag size={15} /> Lihat Detail Pesanan
                </Button>
              </Link>
              <Link href="/produk">
                <Button variant="outline"
                  className="btn-outline w-full flex items-center justify-center gap-2">
                  Lanjut Belanja <ArrowRight size={14} />
                </Button>
              </Link>
            </BtnGroup>
          </InnerContainer>
        </CardBox>
      </ContentWrapper>
    </PageContainer>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
