import { tw } from "tailwind-styled-v4"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, Minus, Plus, Heart, ShoppingCart, Zap, Star, MessageSquare, Loader2, Package } from "lucide-react"

export const PageContainer = tw.div({ base: "min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]" })
export const ContentWrapper = tw.div({ base: "max-w-5xl mx-auto" })

// --- Skeleton ---
export const SkelContainer = tw.div({ base: "min-h-screen py-10 px-4" })
export const SkelBreadcrumb = tw(Skeleton)({ base: "h-4 w-48 bg-obsidian-800 mb-6" })
export const SkelGrid = tw.div({ base: "grid md:grid-cols-2 gap-8" })
export const SkelImage = tw(Skeleton)({ base: "aspect-square bg-obsidian-800 rounded-sm" })
export const SkelInfo = tw.div({ base: "space-y-4" })
export const SkelLine1 = tw(Skeleton)({ base: "h-5 w-24 bg-obsidian-800" })
export const SkelLine2 = tw(Skeleton)({ base: "h-8 w-3/4 bg-obsidian-800" })
export const SkelLine3 = tw(Skeleton)({ base: "h-4 w-32 bg-obsidian-800" })
export const SkelLine4 = tw(Skeleton)({ base: "h-10 w-40 bg-obsidian-800" })
export const SkelLine5 = tw(Skeleton)({ base: "h-12 w-full bg-obsidian-800" })

// --- Breadcrumb ---
export const BreadcrumbNav = tw.nav({ base: "flex items-center gap-2 text-xs text-obsidian-500 mb-8" })
export const BreadcrumbLink = tw(Link)({ base: "hover:text-gold-400 transition-colors flex items-center gap-1" })
export const IconChevronLeft = tw(ChevronLeft)``
export const BreadcrumbText = tw.span({
  base: "",
  variants: {
    color: {
      light: "text-obsidian-300 truncate max-w-48",
      dark: "text-obsidian-400"
    }
  }
})

// --- Product Main ---
export const ProductGrid = tw.div({ base: "grid md:grid-cols-2 gap-10 mb-12" })

export const ProductImageWrapper = tw.div({
  base: "aspect-square bg-obsidian-900 border border-obsidian-800 rounded-sm overflow-hidden",
  sub: {
    div: { placeholderBox: "w-full h-full flex items-center justify-center" }
  }
})
export const ProductImage = tw.img({ base: "w-full h-full object-cover" })
export const IconPackageLarge = tw(Package)({ base: "text-obsidian-700" })

export const ProductInfoWrapper = tw.div({ base: "flex flex-col" })
export const CategoryBadge = tw.span({ base: "badge border-obsidian-700 bg-obsidian-800/40 text-obsidian-400 mb-3 self-start" })
export const ProductName = tw.h1({ base: "font-heading text-3xl text-obsidian-50 leading-tight mb-3" })
export const ProductRatingBox = tw.div({ base: "mb-4" })

export const ProductPrice = tw.p({ base: "font-heading text-3xl text-gold-400 font-bold mb-2" })
export const ProductStockText = tw.p({
  base: "text-xs mb-6",
  variants: {
    status: {
      available: "text-emerald-400",
      empty: "text-red-400"
    }
  }
})

export const ProductDesc = tw.p({ base: "text-sm text-obsidian-400 leading-relaxed mb-6" })

export const QtyControlWrapper = tw.div({ base: "flex items-center gap-3 mb-6" })
export const QtyControlBox = tw.div({ base: "flex items-center border border-obsidian-700 rounded-sm overflow-hidden" })
export const QtyBtn = tw(Button)({ base: "w-10 h-10 text-obsidian-400 hover:text-gold-400 hover:bg-obsidian-800 rounded-none" })
export const QtyValue = tw.span({ base: "w-12 text-center text-sm text-obsidian-100 font-medium" })
export const IconMinus = tw(Minus)``
export const IconPlus = tw(Plus)``
export const QtyMaxText = tw.span({ base: "text-xs text-obsidian-500" })

export const ActionBtnsWrapper = tw.div({ base: "flex gap-3" })
export const AddToCartBtn = tw(Button)({ base: "btn-gold flex-1 flex items-center gap-2" })
export const BuyNowBtn = tw(Button)({ base: "btn-outline flex items-center gap-2" })
export const WishlistBtn = tw(Button)({ base: "w-12 h-12 border border-obsidian-700 text-obsidian-400 hover:text-gold-400 hover:border-gold-700 rounded-sm" })
export const IconLoader = tw(Loader2)({ base: "animate-spin" })
export const IconCart = tw(ShoppingCart)``
export const IconZap = tw(Zap)``
export const IconHeart = tw(Heart)``

export const SectionSeparator = tw(Separator)({ base: "bg-obsidian-800 mb-12" })

// --- Reviews Section ---
export const ReviewsGrid = tw.div({ base: "grid md:grid-cols-[1fr_360px] gap-8" })

export const ReviewsHeaderRow = tw.div({ base: "flex items-center gap-2 mb-6" })
export const IconMessage = tw(MessageSquare)({ base: "text-gold-500" })
export const ReviewsTitle = tw.h2({ base: "font-heading text-xl text-obsidian-100" })
export const ReviewsTotalCount = tw.span({ base: "text-xs text-obsidian-500 ml-1" })

export const ReviewsSummaryCard = tw.div({ base: "flex items-center gap-4 mb-6 p-4 card-dark" })
export const ReviewsSummaryInner = tw.div({ base: "text-center" })
export const ReviewsAvgText = tw.p({ base: "font-heading text-4xl text-gold-400" })
export const ReviewsSummaryCount = tw.p({ base: "text-xs text-obsidian-500 mt-1" })

export const ReviewsEmptyBox = tw.div({ base: "text-center py-10" })
export const IconMessageLarge = tw(MessageSquare)({ base: "text-obsidian-700 mx-auto mb-3" })
export const ReviewsEmptyText = tw.p({ base: "text-obsidian-500 text-sm" })

export const ReviewsListWrapper = tw.div({ base: "space-y-4" })
export const ReviewCard = tw.div({ base: "card-dark p-4" })
export const ReviewHeaderRow = tw.div({ base: "flex items-start justify-between gap-3 mb-2" })
export const ReviewTitle = tw.p({ base: "text-sm font-semibold text-obsidian-200 mt-1" })
export const ReviewMetaWrapper = tw.div({ base: "text-right shrink-0" })
export const ReviewVerifiedBadge = tw.span({ base: "badge border-emerald-800/50 bg-emerald-900/10 text-emerald-500 text-[10px]" })
export const ReviewDateText = tw.p({ base: "text-[11px] text-obsidian-600 mt-1" })
export const ReviewComment = tw.p({ base: "text-sm text-obsidian-400 leading-relaxed" })

export const WriteReviewCard = tw.div({ base: "card-dark p-5 h-fit" })
export const WriteReviewTitle = tw.h3({ base: "font-heading text-lg text-obsidian-100 mb-5" })

export const WriteReviewEmpty = tw.div({ base: "text-center py-6" })
export const WriteReviewEmptyText = tw.p({ base: "text-sm text-obsidian-500 mb-4" })
export const LoginLinkBtn = tw(Link)({ base: "btn-gold text-sm" })

export const StyledFormLabel = tw.label({ base: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest block" })
export const StyledTextarea = tw(Textarea)({ base: "input-dark resize-none" })
export const SubmitReviewBtn = tw(Button)({ base: "btn-gold w-full flex items-center justify-center gap-2" })

export const StarPickerWrapper = tw.div({ base: "flex items-center gap-1" })
export const StarPickerBtn = tw.button({ base: "focus:outline-none transition-transform hover:scale-110" })
export const IconStar = tw(Star)({
  base: "",
  variants: {
    active: {
      true: "star-filled",
      false: "star-empty"
    }
  }
})
export const StarLabelText = tw.span({ base: "text-xs text-obsidian-500 ml-2" })
