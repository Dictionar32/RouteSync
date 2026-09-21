"use client"

import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import { AuthGuard } from "@/components/shared"
import { WishlistList } from "./wishlist-list"
import { useWishlist } from '@/api/hooks'
import useAuthStore from "@/lib/stores/auth-store"
import {
  PageContainer, ContentWrapper, SkelContainer, SkelTitle, SkelLine, SkelGrid, SkelCard,
  HeaderArea, HeaderSubtitle, HeaderRow, HeaderTitle, HeaderCount, HeaderDivider,
  EmptyStateContainer, EmptyStateIconBox, EmptyStateTextWrapper, EmptyStateTitleText, EmptyStateDesc, BrowseBtn
} from "./wishlist.styles"

export default function WishlistPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: resWishlist, isLoading } = useWishlist.index()
  const items = resWishlist ?? []
  const deleteMutation = useWishlist.useDelete()

  const handleRemove = (produkItemId: number) => {
    deleteMutation.mutate(produkItemId, {
      onSuccess: () => toast.success("Dihapus dari wishlist"),
      onError: () => toast.error("Gagal menghapus"),
    })
  }

  if (!isAuthenticated) return <AuthGuard icon={Heart} title="Masuk untuk melihat wishlist" description="Simpan produk favorit Anda" />

  if (isLoading) {
    return (
      <SkelContainer>
        <ContentWrapper>
          <SkelTitle />
          <SkelLine />
          <SkelGrid>
            {[1,2,3,4,5,6].map(i => <SkelCard key={i} />)}
          </SkelGrid>
        </ContentWrapper>
      </SkelContainer>
    )
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderArea>
          <HeaderSubtitle>Koleksi Saya</HeaderSubtitle>
          <HeaderRow>
            <HeaderTitle>Wishlist</HeaderTitle>
            <HeaderCount>{items.length} produk</HeaderCount>
          </HeaderRow>
          <HeaderDivider />
        </HeaderArea>

        {items.length === 0 ? (
          <EmptyStateContainer>
            <EmptyStateIconBox>
              <Heart size={36} className="text-obsidian-600" />
            </EmptyStateIconBox>
            <EmptyStateTextWrapper>
              <EmptyStateTitleText>Wishlist kosong</EmptyStateTitleText>
              <EmptyStateDesc>Simpan produk favorit Anda di sini</EmptyStateDesc>
            </EmptyStateTextWrapper>
            <BrowseBtn onClick={() => router.push("/produk")}>Jelajahi Produk</BrowseBtn>
          </EmptyStateContainer>
        ) : (
          <WishlistList items={items} onRemove={handleRemove} isRemoving={deleteMutation.isPending} />
        )}
      </ContentWrapper>
    </PageContainer>
  )
}
