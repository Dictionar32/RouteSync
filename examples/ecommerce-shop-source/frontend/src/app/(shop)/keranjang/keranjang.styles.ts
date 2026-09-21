import { tw } from "tailwind-styled-v4"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingCart, Package, Tag, Minus, Plus, Trash2, ArrowRight, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

// --- Page Layout Wrappers ---
export const PageContainer = tw.div`min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]`
export const ContentWrapper = tw.div`max-w-5xl mx-auto`
export const GridContainer = tw.div`grid lg:grid-cols-[1fr_340px] gap-6`

// --- UI Wrappers ---
export const SkelTitle = tw(Skeleton)`h-8 w-48 bg-obsidian-800`
export const SkelLine = tw(Skeleton)`h-px w-24 bg-obsidian-800`
export const SkelItem = tw(Skeleton)`h-32 bg-obsidian-800`
export const SkelSummary = tw(Skeleton)`h-64 bg-obsidian-800`

export const IconCart = tw(ShoppingCart)`text-obsidian-600`
export const IconPackage = tw(Package)`text-obsidian-600`
export const IconTag = tw(Tag)`text-gold-500`
export const IconMinus = tw(Minus)``
export const IconPlus = tw(Plus)``
export const IconTrash = tw(Trash2)``
export const IconArrowRight = tw(ArrowRight)``
export const IconX = tw(X)``
export const IconLoader = tw(Loader2)`animate-spin`

export const StyledInput = tw(Input)`input-dark text-xs py-2 flex-1`
export const StyledSeparator = tw(Separator)`bg-obsidian-800 my-4`

export const ActionLink = tw(Link)`btn-gold`
export const ContinueShoppingLink = tw(Link)`block text-center text-xs text-obsidian-500 hover:text-obsidian-300 mt-3 transition-colors`

export const CartItemImg = tw.img`w-full h-full object-cover`

export const QtyBtn = tw(Button)`w-8 h-8 text-obsidian-400 hover:text-gold-400 hover:bg-obsidian-800 rounded-none`
export const RemoveBtn = tw(Button)`w-8 h-8 text-obsidian-500 hover:text-red-400`
export const RemovePromoBtn = tw(Button)`w-6 h-6 text-obsidian-500 hover:text-red-400`
export const ApplyPromoBtn = tw(Button)`border-obsidian-700 bg-transparent text-obsidian-300 hover:border-gold-600 hover:text-gold-400 hover:bg-transparent text-xs`
export const CheckoutBtn = tw(Button)`btn-gold w-full flex items-center justify-center gap-2`

// --- Empty State ---
export const EmptyState = tw.div({
  base: "flex flex-col items-center justify-center py-24 gap-5",
  sub: {
    div: { iconBox: "w-20 h-20 rounded-sm bg-obsidian-800/60 border border-obsidian-700/40 flex items-center justify-center" },
    div2: { textWrapper: "text-center" },
    p: { title: "text-obsidian-300 font-medium mb-1", desc: "text-sm text-obsidian-500" },
  }
})

// --- Cart Items ---
export const ItemsList = tw.div`space-y-3`

export const CartItemCard = tw.div({
  base: "card-dark flex gap-4 p-4 hover:border-obsidian-700 transition-colors",
  sub: {
    div: {
      imageWrapper: "w-20 h-20 shrink-0 bg-obsidian-800 rounded-sm overflow-hidden border border-obsidian-700/40",
      placeholder: "w-full h-full flex items-center justify-center",
      details: "flex-1 min-w-0",
      actionRow: "flex items-center gap-3 mt-3",
      qtyGroup: "flex items-center border border-obsidian-700 rounded-sm overflow-hidden"
    },
    img: { image: "w-full h-full object-cover" },
    p: {
      name: "font-medium text-obsidian-100 text-sm leading-snug mb-1 truncate",
      price: "text-gold-400 font-semibold font-heading text-sm",
      subtotal: "font-semibold text-obsidian-100 font-heading shrink-0"
    },
    span: { qty: "w-8 text-center text-sm text-obsidian-200 font-medium" },
  }
})

// --- Summary Area ---
export const SummaryColumn = tw.div`space-y-4`

export const PromoCard = tw.div({
  base: "card-dark p-4",
  sub: {
    div: {
      headerRow: "flex items-center gap-2 mb-3",
      appliedWrapper: "flex items-center justify-between bg-gold-500/10 border border-gold-800/50 rounded-sm px-3 py-2",
      inputGroup: "flex gap-2"
    },
    p: { label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest" },
    span: { code: "text-sm text-gold-400 font-semibold font-heading" },
  }
})

// --- Totals Area ---
export const TotalsCard = tw.div({
  base: "card-dark p-5",
  sub: {
    p: { header: "text-xs font-semibold text-obsidian-500 uppercase tracking-widest mb-4" },
    div: {
      list: "space-y-2.5 text-sm",
      row: "flex justify-between text-obsidian-400",
      discountRow: "flex justify-between text-gold-500",
      grandTotalWrapper: "flex justify-between font-bold text-base mb-5"
    },
    span: { label: "", value: "", grandLabel: "text-obsidian-100 font-heading", grandValue: "text-gold-400 font-heading" },
  }
})

// --- Loading Skeletons ---
export const SkeletonScreen = tw.div({
  base: "min-h-screen py-12 px-4",
  sub: {
    div: {
      content: "max-w-5xl mx-auto space-y-4",
      grid: "grid lg:grid-cols-[1fr_340px] gap-6 mt-6",
      itemsCol: "space-y-3"
    },
  }
})
