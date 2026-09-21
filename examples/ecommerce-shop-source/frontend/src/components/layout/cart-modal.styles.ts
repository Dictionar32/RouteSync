import { tw } from "tailwind-styled-v4"
import Link from "next/link"

export const Overlay = tw.div({ base: "fixed inset-0 z-[100]" })
export const Backdrop = tw.div({ base: "absolute inset-0 bg-black/70 modal-backdrop" })
export const Drawer = tw.div({ base: "absolute right-0 top-0 bottom-0 w-full max-w-md bg-obsidian-950 border-l border-obsidian-800 flex flex-col shadow-2xl" })

export const Header = tw.div({ base: "flex items-center justify-between px-6 py-5 border-b border-obsidian-800" })
export const HeaderTitleArea = tw.div({ base: "flex items-center gap-3" })
export const StyledShoppingBag = tw.div({ base: "text-gold-500 flex" })
export const Title = tw.h2({ base: "font-heading text-xl text-obsidian-50" })
export const CartCountBadge = tw.span({ base: "text-xs px-2 py-0.5 rounded-sm bg-gold-500/20 text-gold-400 border border-gold-800/50" })
export const CloseButton = tw.button({ base: "p-1.5 text-obsidian-400 hover:text-obsidian-200 transition-colors" })

export const ContentArea = tw.div({ base: "flex-1 overflow-y-auto px-6 py-4 space-y-4" })

// Skeleton
export const SkeletonRow = tw.div({ base: "flex gap-3 animate-pulse" })
export const SkeletonImage = tw.div({ base: "w-16 h-16 shrink-0 bg-obsidian-800 rounded-sm" })
export const SkeletonInfo = tw.div({ base: "flex-1 space-y-2 pt-1" })
export const SkeletonText = tw.div({ base: "h-3 bg-obsidian-800 rounded w-3/4" })
export const SkeletonTextShort = tw.div({ base: "h-3 bg-obsidian-800 rounded w-1/2" })

// Empty State
export const EmptyState = tw.div({ base: "flex flex-col items-center justify-center py-20 text-center" })
export const EmptyStateIcon = tw.div({ base: "text-obsidian-700 mb-4 flex justify-center" })
export const EmptyStateTitle = tw.p({ base: "text-obsidian-400 font-heading text-lg" })
export const EmptyStateSub = tw.p({ base: "text-obsidian-600 text-sm mt-1" })
export const StartShoppingBtn = tw.button({ base: "mt-6 px-5 py-2.5 text-xs bg-gold-500 text-obsidian-950 font-semibold hover:bg-gold-400 transition-colors rounded-sm" })

// Cart Item
export const CartItemRow = tw.div({ base: "flex gap-4 py-3 border-b border-obsidian-800/60 last:border-0" })
export const CartItemImageContainer = tw.div({ base: "w-16 h-16 shrink-0 bg-obsidian-800 rounded-sm overflow-hidden" })
export const CartItemImagePlaceholder = tw.div({ base: "w-full h-full flex items-center justify-center text-obsidian-600" })
export const CartItemInfo = tw.div({ base: "flex-1 min-w-0" })
export const CartItemName = tw.p({ base: "text-obsidian-100 text-sm font-medium truncate" })
export const CartItemPrice = tw.p({ base: "text-gold-500 text-sm mt-0.5" })

export const CartItemActions = tw.div({ base: "flex items-center justify-between mt-2" })
export const QtyControls = tw.div({ base: "flex items-center border border-obsidian-700 rounded-sm" })
export const QtyBtn = tw.button({ base: "px-2 py-1 text-obsidian-400 hover:text-gold-400 transition-colors" })
export const QtyDisplay = tw.span({ base: "px-3 text-sm text-obsidian-100 min-w-8 text-center" })

export const SubtotalArea = tw.div({ base: "flex items-center gap-2" })
export const SubtotalText = tw.span({ base: "text-obsidian-200 text-sm font-medium" })
export const RemoveBtn = tw.button({ base: "text-obsidian-600 hover:text-red-400 transition-colors p-1" })

// Footer
export const Footer = tw.div({ base: "border-t border-obsidian-800 px-6 py-5 space-y-4" })

// Promo
export const AppliedPromoContainer = tw.div({ base: "flex items-center justify-between bg-gold-500/10 border border-gold-800/50 rounded-sm px-3 py-2" })
export const AppliedPromoInfo = tw.div({ base: "flex items-center gap-2" })
export const StyledTagIcon = tw.div({ base: "text-gold-500 flex" })
export const AppliedPromoCode = tw.span({ base: "text-gold-400 text-sm font-medium" })
export const AppliedPromoDiscount = tw.span({ base: "text-gold-600 text-xs" })
export const RemovePromoBtn = tw.button({ base: "text-obsidian-500 hover:text-red-400 transition-colors" })

export const PromoInputContainer = tw.div({ base: "flex gap-2" })
export const PromoInput = tw.input({ base: "flex-1 bg-obsidian-900 border border-obsidian-700 text-obsidian-100 placeholder-obsidian-600 text-xs py-2 px-3 rounded-sm focus:outline-none focus:border-gold-600" })
export const PromoApplyBtn = tw.button({ base: "border border-obsidian-600 text-obsidian-300 hover:border-gold-600 hover:text-gold-400 transition-colors text-xs py-2 px-4 whitespace-nowrap rounded-sm disabled:opacity-50" })

// Totals
export const TotalsContainer = tw.div({ base: "space-y-1.5 text-sm" })
export const TotalRow = tw.div({ base: "flex justify-between text-obsidian-400" })
export const DiscountRow = tw.div({ base: "flex justify-between text-gold-500" })
export const Divider = tw.div({ base: "border-t border-obsidian-800 my-2" })
export const GrandTotalRow = tw.div({ base: "flex justify-between font-semibold text-obsidian-50 text-base" })
export const GrandTotalValue = tw.span({ base: "text-gold-400" })

export const CheckoutLink = tw(Link)({ base: "w-full flex items-center justify-center gap-2 text-center bg-gold-500 text-obsidian-950 font-semibold py-3 hover:bg-gold-400 transition-colors rounded-sm" })
