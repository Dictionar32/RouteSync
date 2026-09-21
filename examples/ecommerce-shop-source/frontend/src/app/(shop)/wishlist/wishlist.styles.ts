import { tw } from "tailwind-styled-v4"
import { Skeleton } from "@/components/ui/skeleton"
import { Star } from "lucide-react"
import Link from "next/link"

export const PageContainer = tw.div({ base: "min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]" })
export const ContentWrapper = tw.div({ base: "max-w-5xl mx-auto" })

// Skeleton
export const SkelContainer = tw.div({ base: "min-h-screen py-10 px-4" })
export const SkelTitle = tw(Skeleton)({ base: "h-8 w-36 bg-obsidian-800 mb-2" })
export const SkelLine = tw(Skeleton)({ base: "h-px w-24 bg-obsidian-800 mb-8" })
export const SkelGrid = tw.div({ base: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" })
export const SkelCard = tw(Skeleton)({ base: "h-80 bg-obsidian-800" })

// Header Area
export const HeaderArea = tw.div({ base: "mb-8" })
export const HeaderSubtitle = tw.p({ base: "text-xs font-semibold text-gold-500 tracking-widest uppercase mb-2" })
export const HeaderRow = tw.div({ base: "flex items-center justify-between" })
export const HeaderTitle = tw.h1({ base: "font-heading text-3xl text-obsidian-50" })
export const HeaderCount = tw.span({ base: "text-xs text-obsidian-500" })
export const HeaderDivider = tw.div({ base: "gold-divider mt-4 w-24" })

// Empty State
export const EmptyStateContainer = tw.div({ base: "flex flex-col items-center justify-center py-24 gap-5" })
export const EmptyStateIconBox = tw.div({ base: "w-20 h-20 rounded-sm bg-obsidian-800/60 border border-obsidian-700/40 flex items-center justify-center" })
export const EmptyStateTextWrapper = tw.div({ base: "text-center" })
export const EmptyStateTitleText = tw.p({ base: "text-obsidian-300 font-medium mb-1" })
export const EmptyStateDesc = tw.p({ base: "text-sm text-obsidian-500" })
export const BrowseBtn = tw.button({ base: "btn-gold" })

// Wishlist List
export const GridContainer = tw.div({ base: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" })
export const CardContainer = tw.div({ base: "border border-obsidian-800/60 bg-obsidian-900/20 rounded-sm overflow-hidden hover:border-obsidian-700 transition-colors group" })

export const CardImageArea = tw.div({ base: "relative aspect-square bg-obsidian-800 overflow-hidden" })
export const CardImage = tw.img({ base: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })
export const RemoveBtn = tw.button({ base: "absolute top-2.5 right-2.5 w-8 h-8 rounded-sm bg-obsidian-900/80 border border-obsidian-700/50 text-obsidian-400 hover:text-red-400 hover:border-red-800/60 transition-colors flex items-center justify-center disabled:opacity-50" })

export const CardContentArea = tw.div({ base: "p-4" })
export const CatText = tw.p({ base: "text-xs text-obsidian-600 mb-1" })
export const ProductName = tw.h3({ base: "text-sm text-obsidian-200 font-medium line-clamp-2 mb-2 min-h-10" })

export const RatingWrapper = tw.div({ base: "flex items-center gap-1.5 mb-2" })
export const StarsBox = tw.div({ base: "flex items-center" })
export const StarIcon = tw(Star)({
  base: "",
  variants: {
    active: {
      true: "star-filled",
      false: "star-empty"
    }
  }
})
export const RatingCount = tw.span({ base: "text-xs text-obsidian-600" })
export const PriceText = tw.p({ base: "text-gold-400 font-semibold font-heading mb-3" })
export const ProductLinkBtn = tw(Link)({ base: "w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-obsidian-800 text-obsidian-200 border border-obsidian-700 hover:bg-gold-500 hover:text-obsidian-950 hover:border-gold-500 transition-all rounded-sm" })
