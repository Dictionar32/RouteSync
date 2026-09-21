"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Package, Download, ChevronRight, FileText, Loader2, ShoppingBag, User } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { PageLoader, ErrorState, AuthGuard, SectionHeader, StatusBadge } from "@/components/shared"

import useAuthStore from "@/lib/stores/auth-store"
import { formatPrice, formatDate } from "@/lib/utils-frontend"
import { useOrders } from '@/api/hooks'
import { OrderResourceTransformed } from "@/api/types"
import apiClient from "@/lib/core/api-client"
import {
  PageContainer, ContentWrapper, GridContainer, SidebarWrapper, SidebarCard, SidebarCardSm,
  UserProfileBox, UserAvatar, UserInfoWrapper, UserName, UserEmail, NavContainer, NavLinkItem,
  OrderListTitle, OrderEmptyBox, OrderEmptyText, OrderEmptyLink, OrderListWrapper, OrderListItemBtn,
  OrderListRow, OrderListInv, OrderListDate, OrderListTotal,
  DetailMain, DetailEmptyBox, DetailEmptyIconBox, DetailEmptyText,
  SkelDetailWrapper, SkelDetail1, SkelDetail2, SkelDetailSep, SkelDetail3, SkelDetail4,
  DetailContentWrapper, DetailHeaderRow, DetailInvoiceTitle, DetailDate, DetailStatusWrapper, DetailDownloadBtn,
  ShippingCard, ShippingTitle, ShippingName, ShippingAddress, ShippingCity, ShippingPhone,
  ItemsTitle, ItemsWrapper, ItemCard, ItemImageBox, ItemImage, ItemImagePlaceholder, ItemInfoWrapper, ItemName, ItemQty, ItemSubtotal,
  DetailSeparator, DetailSeparatorSm, TotalsWrapper, TotalRowBox, GrandTotalRowBox, GrandTotalLabel, GrandTotalValue
} from "./orders.styles"

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { data: resOrders, isLoading, isError } = useOrders.index()
  const orders = resOrders ?? []
  const { data: resDetail, isLoading: detailLoading } = useOrders.show(selectedId ?? 0)
  const detail = resDetail

  const handleDownloadInvoice = async (orderId: number) => {
    setDownloadingId(orderId)
    try {
      const response = await apiClient.get(`/orders/${orderId}/invoice`, { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }))
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-order-${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Invoice berhasil diunduh")
    } catch {
      toast.error("Gagal mengunduh invoice")
    } finally {
      setDownloadingId(null)
    }
  }

  if (!mounted || !isAuthenticated) return <AuthGuard icon={Package} title="Masuk untuk melihat pesanan" description="Lacak semua pesanan Anda di satu tempat" />
  if (isLoading) return <PageLoader text="Memuat pesanan..." />
  if (isError) return <ErrorState title="Gagal memuat pesanan" />

  return (
    <PageContainer>
      <ContentWrapper>
        <SectionHeader label="Akun Saya" title="Pesanan Saya" subtitle="Riwayat dan detail semua pesanan Anda" />

        <GridContainer>
          {/* Sidebar */}
          <SidebarWrapper>
            <SidebarCard>
              <UserProfileBox>
                <UserAvatar>
                  {user?.name?.charAt(0).toUpperCase()}
                </UserAvatar>
                <UserInfoWrapper>
                  <UserName>{user?.name}</UserName>
                  <UserEmail>{user?.email}</UserEmail>
                </UserInfoWrapper>
              </UserProfileBox>
              <NavContainer>
                {[
                  { href: "/profile", label: "Profil Saya", icon: User },
                  { href: "/orders",  label: "Pesanan",     icon: ShoppingBag, active: true },
                ].map(({ href, label, icon: Icon, active }) => (
                  <NavLinkItem key={href} href={href} active={active ? "true" : "false"}>
                    <Icon size={14} />{label}
                    {active && <ChevronRight size={13} className="ml-auto" />}
                  </NavLinkItem>
                ))}
              </NavContainer>
            </SidebarCard>

            <SidebarCardSm>
              <OrderListTitle>Riwayat Pesanan</OrderListTitle>
              {!orders?.length ? (
                <OrderEmptyBox>
                  <Package size={32} className="text-obsidian-700 mx-auto mb-3" />
                  <OrderEmptyText>Belum ada pesanan</OrderEmptyText>
                  <OrderEmptyLink href="/produk">Mulai belanja</OrderEmptyLink>
                </OrderEmptyBox>
              ) : (
                <ScrollArea className="max-h-[480px]">
                  <OrderListWrapper>
                    {orders.map((order: any) => (
                      <OrderListItemBtn key={order.id} onClick={() => setSelectedId(order.id)}
                        active={selectedId === order.id ? "true" : "false"}>
                        <OrderListRow>
                          <OrderListInv>{order.invoiceNumber || `#${order.id}`}</OrderListInv>
                          <StatusBadge status={order.paymentStatus} />
                        </OrderListRow>
                        <OrderListDate>{formatDate(order.createdAt)}</OrderListDate>
                        <OrderListTotal>{formatPrice(order.totalHargaMinor)}</OrderListTotal>
                      </OrderListItemBtn>
                    ))}
                  </OrderListWrapper>
                </ScrollArea>
              )}
            </SidebarCardSm>
          </SidebarWrapper>

          {/* Detail Panel */}
          <DetailMain>
            {!selectedId ? (
              <DetailEmptyBox>
                <DetailEmptyIconBox>
                  <FileText size={28} className="text-obsidian-600" />
                </DetailEmptyIconBox>
                <DetailEmptyText>Pilih pesanan untuk melihat detail</DetailEmptyText>
              </DetailEmptyBox>
            ) : detailLoading ? (
              <SkelDetailWrapper>
                <SkelDetail1 />
                <SkelDetail2 />
                <SkelDetailSep />
                <SkelDetail3 />
                <SkelDetail4 />
                <SkelDetail4 />
              </SkelDetailWrapper>
            ) : detail ? (
              <DetailContentWrapper>
                {/* Header */}
                <DetailHeaderRow>
                  <div>
                    <DetailInvoiceTitle>{detail.invoiceNumber || `Order #${detail.id}`}</DetailInvoiceTitle>
                    <DetailDate>{formatDate(detail.createdAt ?? "")}</DetailDate>
                    <DetailStatusWrapper>
                      <StatusBadge status={detail.paymentStatus ?? detail.status ?? ""} />
                      {detail.fulfillmentStatus && detail.fulfillmentStatus !== detail.paymentStatus && (
                        <StatusBadge status={detail.fulfillmentStatus} />
                      )}
                    </DetailStatusWrapper>
                  </div>
                  <DetailDownloadBtn variant="outline"
                    onClick={() => handleDownloadInvoice(detail.id)}
                    disabled={downloadingId === detail.id}>
                    {downloadingId === detail.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Invoice
                  </DetailDownloadBtn>
                </DetailHeaderRow>

                {/* Shipping */}
                {detail.shippingNama && (
                  <ShippingCard>
                    <ShippingTitle>Alamat Pengiriman</ShippingTitle>
                    <ShippingName>{detail.shippingNama}</ShippingName>
                    <ShippingAddress>{detail.shippingAlamat}</ShippingAddress>
                    <ShippingCity>{detail.shippingKota}{detail.shippingKodePos ? `, ${detail.shippingKodePos}` : ""}</ShippingCity>
                    {detail.shippingTelepon && <ShippingPhone>{detail.shippingTelepon}</ShippingPhone>}
                  </ShippingCard>
                )}

                {/* Items */}
                <ItemsTitle>Item Pesanan</ItemsTitle>
                <ItemsWrapper>
                  {detail.items?.map((item: any) => (
                    <ItemCard key={item.produkItemId}>
                      <ItemImageBox>
                        {item.produkImageUrl
                          ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <ItemImage src={item.produkImageUrl} alt={item.produkNama} />
                          )
                          : <ItemImagePlaceholder><Package size={18} className="text-obsidian-600" /></ItemImagePlaceholder>
                        }
                      </ItemImageBox>
                      <ItemInfoWrapper>
                        <ItemName>{item.produkNama}</ItemName>
                        <ItemQty>{item.qty} × {formatPrice(item.harga)}</ItemQty>
                      </ItemInfoWrapper>
                      <ItemSubtotal>{formatPrice(item.subtotal)}</ItemSubtotal>
                    </ItemCard>
                  ))}
                </ItemsWrapper>

                {/* Totals */}
                <DetailSeparator />
                <TotalsWrapper>
                  {[
                    { label: "Subtotal", val: detail.subtotalMinor, show: true },
                    { label: `Diskon${detail.promotionCode ? ` (${detail.promotionCode})` : ""}`, val: -(detail.discountMinor ?? 0), show: (detail.discountMinor ?? 0) > 0, cls: "gold" as const },
                    { label: "Ongkos Kirim", val: detail.shippingMinor ?? 0, show: (detail.shippingMinor ?? 0) > 0 },
                  ].filter(r => r.show).map(row => (
                    <TotalRowBox key={row.label} color={row.cls ?? "default"}>
                      <span>{row.label}</span>
                      <span>{(row.val ?? 0) < 0 ? `-${formatPrice(-(row.val ?? 0))}` : formatPrice(row.val ?? 0)}</span>
                    </TotalRowBox>
                  ))}
                  <DetailSeparatorSm />
                  <GrandTotalRowBox>
                    <GrandTotalLabel>Total</GrandTotalLabel>
                    <GrandTotalValue>{formatPrice(detail.totalHargaMinor ?? detail.totalHarga ?? 0)}</GrandTotalValue>
                  </GrandTotalRowBox>
                </TotalsWrapper>
              </DetailContentWrapper>
            ) : null}
          </DetailMain>
        </GridContainer>
      </ContentWrapper>
    </PageContainer>
  )
}
