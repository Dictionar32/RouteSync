import { tw } from "tailwind-styled-v4"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const PageContainer = tw.div({ base: "min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]" })
export const ContentWrapper = tw.div({ base: "max-w-6xl mx-auto" })
export const GridContainer = tw.div({ base: "grid lg:grid-cols-[280px_1fr] gap-6" })

// Sidebar
export const SidebarWrapper = tw.aside({ base: "space-y-4" })
export const SidebarCard = tw.div({ base: "card-dark p-5" })
export const SidebarCardSm = tw.div({ base: "card-dark p-4" })

// User Profile snippet
export const UserProfileBox = tw.div({ base: "flex items-center gap-3 mb-4 pb-4 border-b border-obsidian-800" })
export const UserAvatar = tw.div({ base: "w-11 h-11 rounded-sm bg-gradient-to-br from-gold-600/30 to-gold-400/10 border border-gold-700/40 flex items-center justify-center text-gold-400 font-heading font-bold text-lg shrink-0" })
export const UserInfoWrapper = tw.div({ base: "min-w-0" })
export const UserName = tw.p({ base: "font-semibold text-obsidian-100 text-sm truncate" })
export const UserEmail = tw.p({ base: "text-xs text-obsidian-500 truncate" })

export const NavContainer = tw.nav({ base: "space-y-1" })
export const NavLinkItem = tw(Link)({
  base: "flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-colors",
  variants: {
    active: {
      true: "bg-gold-500/10 text-gold-400 border border-gold-800/40",
      false: "text-obsidian-400 hover:bg-obsidian-800/40 hover:text-obsidian-200"
    }
  }
})

// Orders List
export const OrderListTitle = tw.p({ base: "text-xs font-semibold text-obsidian-500 uppercase tracking-widest mb-3" })
export const OrderEmptyBox = tw.div({ base: "text-center py-8" })
export const OrderEmptyText = tw.p({ base: "text-xs text-obsidian-500 mb-3" })
export const OrderEmptyLink = tw(Link)({ base: "text-xs text-gold-500 hover:text-gold-400 underline underline-offset-2" })

export const OrderListWrapper = tw.div({ base: "space-y-2 pr-1" })
export const OrderListItemBtn = tw.button({
  base: "w-full text-left p-3 rounded-sm border transition-all duration-150",
  variants: {
    active: {
      true: "border-gold-700/70 bg-gold-500/5",
      false: "border-obsidian-800/60 hover:border-obsidian-700 hover:bg-obsidian-800/20"
    }
  }
})
export const OrderListRow = tw.div({ base: "flex items-center justify-between mb-1.5 gap-2" })
export const OrderListInv = tw.span({ base: "text-xs font-semibold text-obsidian-200 truncate" })
export const OrderListDate = tw.p({ base: "text-[11px] text-obsidian-600" })
export const OrderListTotal = tw.p({ base: "text-xs text-gold-500 mt-1 font-semibold font-heading" })

// Detail Panel
export const DetailMain = tw.main({ base: "card-dark p-6 min-h-[500px]" })
export const DetailEmptyBox = tw.div({ base: "flex flex-col items-center justify-center h-full min-h-80 gap-4" })
export const DetailEmptyIconBox = tw.div({ base: "w-16 h-16 rounded-sm bg-obsidian-800/60 border border-obsidian-700/40 flex items-center justify-center" })
export const DetailEmptyText = tw.p({ base: "text-obsidian-500 text-sm" })

// Detail Skeleton
export const SkelDetailWrapper = tw.div({ base: "space-y-4" })
export const SkelDetail1 = tw(Skeleton)({ base: "h-7 w-48 bg-obsidian-800" })
export const SkelDetail2 = tw(Skeleton)({ base: "h-4 w-32 bg-obsidian-800" })
export const SkelDetailSep = tw(Separator)({ base: "bg-obsidian-800 my-4" })
export const SkelDetail3 = tw(Skeleton)({ base: "h-24 bg-obsidian-800" })
export const SkelDetail4 = tw(Skeleton)({ base: "h-20 bg-obsidian-800" })

// Detail Content
export const DetailContentWrapper = tw.div({ base: "animate-[fadeIn_0.3s_ease]" })
export const DetailHeaderRow = tw.div({ base: "flex items-start justify-between mb-6 pb-5 border-b border-obsidian-800 gap-4" })
export const DetailInvoiceTitle = tw.h2({ base: "font-heading text-2xl text-obsidian-50" })
export const DetailDate = tw.p({ base: "text-sm text-obsidian-500 mt-1" })
export const DetailStatusWrapper = tw.div({ base: "flex items-center gap-2 mt-2 flex-wrap" })

export const DetailDownloadBtn = tw(Button)({ base: "border-obsidian-700 bg-transparent text-obsidian-300 hover:border-gold-600 hover:text-gold-400 hover:bg-transparent shrink-0 text-xs uppercase tracking-wide" })

export const ShippingCard = tw.div({ base: "bg-obsidian-900/50 border border-obsidian-800/50 rounded-sm p-4 mb-6" })
export const ShippingTitle = tw.p({ base: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest mb-3" })
export const ShippingName = tw.p({ base: "text-sm font-semibold text-obsidian-100" })
export const ShippingAddress = tw.p({ base: "text-sm text-obsidian-400 mt-0.5" })
export const ShippingCity = tw.p({ base: "text-sm text-obsidian-400" })
export const ShippingPhone = tw.p({ base: "text-xs text-obsidian-500 mt-1" })

export const ItemsTitle = tw.p({ base: "text-xs font-semibold text-obsidian-500 uppercase tracking-widest mb-3" })
export const ItemsWrapper = tw.div({ base: "space-y-2.5 mb-6" })
export const ItemCard = tw.div({ base: "flex items-center gap-4 p-3.5 border border-obsidian-800/40 bg-obsidian-900/30 rounded-sm" })
export const ItemImageBox = tw.div({ base: "w-14 h-14 bg-obsidian-800 rounded-sm shrink-0 overflow-hidden border border-obsidian-700/40" })
export const ItemImage = tw.img({ base: "w-full h-full object-cover" })
export const ItemImagePlaceholder = tw.div({ base: "w-full h-full flex items-center justify-center" })
export const ItemInfoWrapper = tw.div({ base: "flex-1 min-w-0" })
export const ItemName = tw.p({ base: "font-medium text-obsidian-200 text-sm truncate" })
export const ItemQty = tw.p({ base: "text-xs text-obsidian-500 mt-1" })
export const ItemSubtotal = tw.p({ base: "font-semibold text-obsidian-100 text-sm font-heading shrink-0" })

export const DetailSeparator = tw(Separator)({ base: "bg-obsidian-800 mb-4" })
export const DetailSeparatorSm = tw(Separator)({ base: "bg-obsidian-800 my-2" })

export const TotalsWrapper = tw.div({ base: "space-y-2.5" })
export const TotalRowBox = tw.div({
  base: "flex justify-between text-sm",
  variants: {
    color: {
      default: "text-obsidian-400",
      gold: "text-gold-500"
    }
  }
})
export const GrandTotalRowBox = tw.div({ base: "flex justify-between font-bold text-base" })
export const GrandTotalLabel = tw.span({ base: "text-obsidian-100 font-heading" })
export const GrandTotalValue = tw.span({ base: "text-gold-400 font-heading" })
