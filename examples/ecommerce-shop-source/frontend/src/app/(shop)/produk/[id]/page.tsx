"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronLeft, Minus, Plus, Heart, ShoppingCart, Zap, Star, MessageSquare, Loader2, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { ErrorState } from "@/components/shared/error-state"
import { StarRating } from "@/components/shared/star-rating"

import { useProduk, useCart, useWishlist, useProdukReviews } from '@/api/hooks'
import { useCartUiStore } from "@/lib/stores/cart-ui-store"
import useAuthStore from "@/lib/stores/auth-store"
import { formatPrice } from "@/lib/utils-frontend"

import {
  PageContainer, ContentWrapper,
  SkelContainer, SkelBreadcrumb, SkelGrid, SkelImage, SkelInfo, SkelLine1, SkelLine2, SkelLine3, SkelLine4, SkelLine5,
  BreadcrumbNav, BreadcrumbLink, IconChevronLeft, BreadcrumbText,
  ProductGrid, ProductImageWrapper, ProductImage, IconPackageLarge,
  ProductInfoWrapper, CategoryBadge, ProductName, ProductRatingBox, ProductPrice, ProductStockText, ProductDesc,
  QtyControlWrapper, QtyControlBox, QtyBtn, QtyValue, IconMinus, IconPlus, QtyMaxText,
  ActionBtnsWrapper, AddToCartBtn, BuyNowBtn, WishlistBtn as StyledWishlistBtn, IconLoader, IconCart, IconZap, IconHeart,
  SectionSeparator,
  ReviewsGrid, ReviewsHeaderRow, IconMessage, ReviewsTitle, ReviewsTotalCount,
  ReviewsSummaryCard, ReviewsSummaryInner, ReviewsAvgText, ReviewsSummaryCount,
  ReviewsEmptyBox, IconMessageLarge, ReviewsEmptyText,
  ReviewsListWrapper, ReviewCard, ReviewHeaderRow, ReviewTitle, ReviewMetaWrapper, ReviewVerifiedBadge, ReviewDateText, ReviewComment,
  WriteReviewCard, WriteReviewTitle, WriteReviewEmpty, WriteReviewEmptyText, LoginLinkBtn,
  StyledFormLabel, StyledTextarea, SubmitReviewBtn,
  StarPickerWrapper, StarPickerBtn, IconStar, StarLabelText
} from "./produk-detail.styles"

const ReviewSchema = z.object({
  rating: z.number().min(1, "Pilih rating").max(5),
  comment: z.string().min(5, "Ulasan minimal 5 karakter"),
  title: z.string().optional(),
})

function DetailSkeleton() {
  return (
    <SkelContainer>
      <ContentWrapper>
        <SkelBreadcrumb />
        <SkelGrid>
          <SkelImage />
          <SkelInfo>
            <SkelLine1 />
            <SkelLine2 />
            <SkelLine3 />
            <SkelLine4 />
            <SkelLine5 />
          </SkelInfo>
        </SkelGrid>
      </ContentWrapper>
    </SkelContainer>
  )
}

export default function ProdukDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const [qty, setQty] = useState(1)
  const [hoverRating, setHoverRating] = useState(0)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { openCart } = useCartUiStore()

  const { data: product, isLoading, isError } = useProduk.show(id)
  const { data: reviewData } = useProdukReviews.useShow(id)
  const cart = useCart()
  const addToWishlist = useWishlist.useCreate()
  const submitReview = useProdukReviews.usePost()

  useEffect(() => {
    return cart.on("add:success", () => {
      openCart();
    });
  }, [cart, openCart]);

  const form = useForm<z.infer<typeof ReviewSchema>>({
    resolver: zodResolver(ReviewSchema),
    defaultValues: { rating: 0, comment: "", title: "" },
  })

  const watchRating = form.watch("rating")

  const handleAddToCart = () => {
    if (!isAuthenticated) { toast.error("Masuk untuk menambahkan ke keranjang"); return }
    if (!product?.id) { toast.error("Produk tidak tersedia"); return }
    cart.items.add(String(product.id), qty)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) { toast.error("Masuk terlebih dahulu"); return }
    if (!product?.id) return
    cart.items.add(String(product.id), qty).then(() => router.push("/keranjang"))
  }

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.error("Masuk untuk menambahkan ke wishlist"); return }
    if (!product?.id) return
    addToWishlist.mutate({ produkItemId: String(product.id) })
  }

  const onReviewSubmit = async (values: z.infer<typeof ReviewSchema>) => {
    if (!isAuthenticated) { toast.error("Masuk untuk menulis ulasan"); return }
    try {
      await submitReview.mutateAsync({
        id,
        rating: values.rating,
        title: values.title ?? undefined,
        comment: values.comment ?? undefined
      })
      form.reset()
    } catch {}
  }

  if (isLoading) return <DetailSkeleton />
  if (isError || !product) return (
    <ErrorState title="Produk tidak ditemukan"
      description="Produk yang Anda cari tidak tersedia"
      actionLabel="Kembali ke Produk"
      onAction={() => router.push("/produk")} />
  )

  const isOutOfStock = product.stok === 0
  const reviews = reviewData?.reviewsData ?? []
  const summary = reviewData ? {
    avg_rating: reviewData.summaryAvgRating,
    total_review: reviewData.summaryTotalReview
  } : undefined

  return (
    <PageContainer>
      <ContentWrapper>
        {/* Breadcrumb */}
        <BreadcrumbNav>
          <BreadcrumbLink href="/produk">
            <IconChevronLeft size={12} /> Semua Produk
          </BreadcrumbLink>
          <span>/</span>
          <BreadcrumbText color="dark">{product.categoryName}</BreadcrumbText>
          <span>/</span>
          <BreadcrumbText color="light">{product.nama}</BreadcrumbText>
        </BreadcrumbNav>

        {/* Product Main */}
        <ProductGrid>
          {/* Image */}
          <ProductImageWrapper>
            {product.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <ProductImage src={product.imageUrl} alt={product.nama} />
            ) : (
              <ProductImageWrapper.placeholderBox>
                <IconPackageLarge size={64} />
              </ProductImageWrapper.placeholderBox>
            )}
          </ProductImageWrapper>

          {/* Info */}
          <ProductInfoWrapper>
            <CategoryBadge>
              {product.categoryName}
            </CategoryBadge>
            <ProductName>{product.nama}</ProductName>

            {(product.reviewCount ?? 0) > 0 && (
              <ProductRatingBox>
                <StarRating rating={product.rating} count={product.reviewCount} size={16} />
              </ProductRatingBox>
            )}

            <ProductPrice>{formatPrice(product.harga)}</ProductPrice>
            <ProductStockText status={product.stok > 0 ? "available" : "empty"}>
              {product.stok > 0 ? `Stok: ${product.stok} tersedia` : "Stok habis"}
            </ProductStockText>

            {product.deskripsi && (
              <ProductDesc>{product.deskripsi}</ProductDesc>
            )}

            {!isOutOfStock && (
              <QtyControlWrapper>
                <QtyControlBox>
                  <QtyBtn variant="ghost" size="icon"
                    onClick={() => setQty(q => Math.max(1, q - 1))}>
                    <IconMinus size={14} />
                  </QtyBtn>
                  <QtyValue>{qty}</QtyValue>
                  <QtyBtn variant="ghost" size="icon"
                    onClick={() => setQty(q => Math.min(product.stok, q + 1))}>
                    <IconPlus size={14} />
                  </QtyBtn>
                </QtyControlBox>
                <QtyMaxText>Maks. {product.stok}</QtyMaxText>
              </QtyControlWrapper>
            )}

            <ActionBtnsWrapper>
              <AddToCartBtn
                disabled={isOutOfStock || cart.items.createMut.isPending}
                onClick={handleAddToCart}>
                {cart.items.createMut.isPending ? <IconLoader size={14} /> : <IconCart size={14} />}
                {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </AddToCartBtn>
              <BuyNowBtn variant="outline"
                disabled={isOutOfStock} onClick={handleBuyNow}>
                <IconZap size={14} /> Beli Sekarang
              </BuyNowBtn>
              <StyledWishlistBtn variant="ghost" size="icon" onClick={handleWishlist}>
                <IconHeart size={16} />
              </StyledWishlistBtn>
            </ActionBtnsWrapper>
          </ProductInfoWrapper>
        </ProductGrid>

        <SectionSeparator />

        {/* Reviews Section */}
        <ReviewsGrid>
          {/* Review List */}
          <div>
            <ReviewsHeaderRow>
              <IconMessage size={16} />
              <ReviewsTitle>Ulasan Pelanggan</ReviewsTitle>
              {summary && <ReviewsTotalCount>({summary.total_review})</ReviewsTotalCount>}
            </ReviewsHeaderRow>

            {summary && summary.total_review > 0 && (
              <ReviewsSummaryCard>
                <ReviewsSummaryInner>
                  <ReviewsAvgText>{summary.avg_rating.toFixed(1)}</ReviewsAvgText>
                  <StarRating rating={summary.avg_rating} size={14} />
                  <ReviewsSummaryCount>{summary.total_review} ulasan</ReviewsSummaryCount>
                </ReviewsSummaryInner>
              </ReviewsSummaryCard>
            )}

            {reviews.length === 0 ? (
              <ReviewsEmptyBox>
                <IconMessageLarge size={32} />
                <ReviewsEmptyText>Belum ada ulasan untuk produk ini</ReviewsEmptyText>
              </ReviewsEmptyBox>
            ) : (
              <ReviewsListWrapper>
                {reviews.map((review) => (
                  <ReviewCard key={review.id}>
                    <ReviewHeaderRow>
                      <div>
                        <StarRating rating={review.rating} size={13} />
                        {review.title && <ReviewTitle>{review.title}</ReviewTitle>}
                      </div>
                      <ReviewMetaWrapper>
                        {review.isVerifiedPurchase && (
                          <ReviewVerifiedBadge>Verified</ReviewVerifiedBadge>
                        )}
                        <ReviewDateText>{review.createdAt ? new Date(review.createdAt).toLocaleDateString("id-ID") : ""}</ReviewDateText>
                      </ReviewMetaWrapper>
                    </ReviewHeaderRow>
                    <ReviewComment>{review.comment}</ReviewComment>
                  </ReviewCard>
                ))}
              </ReviewsListWrapper>
            )}
          </div>

          {/* Write Review */}
          <WriteReviewCard>
            <WriteReviewTitle>Tulis Ulasan</WriteReviewTitle>

            {!isAuthenticated ? (
              <WriteReviewEmpty>
                <WriteReviewEmptyText>Masuk untuk menulis ulasan</WriteReviewEmptyText>
                <LoginLinkBtn href="/login">Masuk</LoginLinkBtn>
              </WriteReviewEmpty>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onReviewSubmit)} className="space-y-4">
                  {/* Star Picker */}
                  <FormField name="rating" control={form.control} render={({ field }) => (
                    <FormItem>
                      <StyledFormLabel>Rating *</StyledFormLabel>
                      <FormControl>
                        <StarPickerWrapper>
                          {[1,2,3,4,5].map((star) => (
                            <StarPickerBtn key={star} type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => field.onChange(star)}>
                              <IconStar size={24} fill="currentColor"
                                active={star <= (hoverRating || watchRating) ? "true" : "false"} />
                            </StarPickerBtn>
                          ))}
                          {watchRating > 0 && (
                            <StarLabelText>
                              {["","Jelek","Kurang","Cukup","Bagus","Sempurna"][watchRating]}
                            </StarLabelText>
                          )}
                        </StarPickerWrapper>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField name="comment" control={form.control} render={({ field }) => (
                    <FormItem>
                      <StyledFormLabel>Ulasan *</StyledFormLabel>
                      <FormControl>
                        <StyledTextarea placeholder="Bagaimana pengalaman Anda dengan produk ini?" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <SubmitReviewBtn type="submit" disabled={submitReview.isPending}>
                    {submitReview.isPending ? <IconLoader size={14} /> : "Kirim Ulasan"}
                  </SubmitReviewBtn>
                </form>
              </Form>
            )}
          </WriteReviewCard>
        </ReviewsGrid>
      </ContentWrapper>
    </PageContainer>
  )
}
