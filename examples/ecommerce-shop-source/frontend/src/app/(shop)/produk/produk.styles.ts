import { tw } from "tailwind-styled-v4"
import Link from "next/link"
import { Search, SlidersHorizontal, X, Gem, Heart, ShoppingCart, Star } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

// --- Page & Header ---
export const PageContainer = tw.div({ base: "min-h-screen animate-[fadeIn_0.4s_ease]" })

export const HeaderArea = tw.div({
  base: "border-b border-obsidian-800/60 bg-obsidian-950/80",
  sub: {
    div: {
      container: "max-w-7xl mx-auto px-4 lg:px-8 py-10",
      badgeRow: "flex items-center gap-2 mb-2"
    },
    span: { badgeText: "text-xs font-semibold text-gold-500 tracking-widest uppercase" },
    h1: { title: "font-heading text-4xl text-obsidian-50" },
    p: { subtitle: "text-obsidian-500 text-sm mt-1" }
  }
})

export const IconGem = tw(Gem)({ base: "text-gold-500" })

export const ContentContainer = tw.div({ base: "max-w-7xl mx-auto px-4 lg:px-8 py-8" })

// --- Toolbar ---
export const ToolbarCard = tw.div({ base: "card-dark p-4 mb-6" })
export const ToolbarRow = tw.div({ base: "flex flex-col md:flex-row gap-3" })

export const SearchWrapper = tw.div({ base: "relative flex-1" })
export const SearchInput = tw.input({ base: "input-dark pl-9 pr-9 py-2.5 w-full" })
export const SearchClearBtn = tw.button({ base: "absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-500 hover:text-obsidian-300 transition-colors" })

export const IconSearch = tw(Search)({ base: "absolute left-3 top-1/2 -translate-y-1/2 text-obsidian-500 pointer-events-none" })
export const IconX = tw(X)``

export const SortDesktopWrapper = tw.div({ base: "hidden md:flex items-center gap-3" })

export const StyledSelectTrigger = tw(SelectTrigger)({ base: "w-52 bg-obsidian-900 border-obsidian-700 text-obsidian-200" })
export const StyledSelectContent = tw(SelectContent)({ base: "bg-obsidian-900 border-obsidian-700" })

// --- Category Pills ---
export const CatDesktopContainer = tw.div({ base: "hidden md:flex flex-wrap gap-2 mt-4 pt-4 border-t border-obsidian-800" })
export const CatMobileContainer = tw.div({ base: "md:hidden flex gap-2 mt-4 pt-4 border-t border-obsidian-800 overflow-x-auto pb-1 -mx-4 px-4" })

export const CatPillBtn = tw.button({
  base: "px-3.5 py-1.5 text-xs rounded-sm border transition-all duration-150 shrink-0",
  variants: {
    active: {
      true: "bg-gold-500/15 border-gold-700/60 text-gold-400 font-medium",
      false: "border-obsidian-700 text-obsidian-400 hover:border-obsidian-600 hover:text-obsidian-200"
    }
  }
})

// --- Active Filters ---
export const ActiveFiltersContainer = tw.div({
  base: "flex items-center gap-2 mt-3 pt-3 border-t border-obsidian-800 flex-wrap",
  sub: {
    span: {
      label: "text-xs text-obsidian-500",
      chip: "inline-flex items-center gap-1 bg-gold-500/10 border border-gold-800/50 text-gold-400 text-xs px-2 py-0.5 rounded-sm"
    }
  }
})

export const ActiveFilterChipBtn = tw.button({ base: "hover:text-gold-300" })
export const ActiveFiltersResetBtn = tw.button({ base: "text-xs text-obsidian-500 hover:text-gold-400 underline ml-auto transition-colors" })

// --- Content Area ---
export const ResultsCountInfo = tw.p({
  base: "text-sm text-obsidian-500 mb-5",
  sub: {
    span: { count: "text-obsidian-200 font-medium" }
  }
})

export const EmptySearchContainer = tw.div({
  base: "card-dark text-center py-24",
  sub: {
    h3: { title: "font-heading text-xl text-obsidian-300 mb-2" },
    p: { desc: "text-obsidian-500 text-sm mb-6" }
  }
})
export const EmptySearchResetBtn = tw.button({ base: "btn-gold" })
export const IconSearchLarge = tw(Search)({ base: "text-obsidian-700 mx-auto mb-4" })

export const GridContainer = tw.div({ base: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5" })

export const GridItemWrapper = tw.div({ base: "animate-[slideUp_0.4s_ease_both]" })

// --- Mobile Filter Sheet ---
export const MobileFilterBtn = tw.button({ base: "lg:hidden flex items-center gap-2 border border-obsidian-700 hover:border-gold-600 text-obsidian-300 hover:text-gold-400 px-3 py-2 rounded-sm text-sm transition-colors" })
export const IconSliders = tw(SlidersHorizontal)``

export const StyledSheetContent = tw(SheetContent)({ base: "bg-obsidian-950 border-l border-obsidian-800" })
export const StyledSheetTitle = tw(SheetTitle)({ base: "text-obsidian-100 font-heading" })

export const SheetBody = tw.div({
  base: "space-y-6 mt-6",
  sub: {
    div: { section: "space-y-3", list: "space-y-1" },
    h3: { label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest" }
  }
})

export const SheetCatBtn = tw.button({
  base: "w-full text-left px-3 py-2 rounded-sm text-sm transition-colors",
  variants: {
    active: {
      true: "bg-gold-500/15 text-gold-400 border border-gold-800/50",
      false: "text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-900"
    }
  }
})

export const SheetSelectTrigger = tw(SelectTrigger)({ base: "bg-obsidian-900 border-obsidian-700 text-obsidian-200" })
export const SheetSelectContent = tw(SelectContent)({ base: "bg-obsidian-900 border-obsidian-700" })

// --- Produk Card ---
export const CardLink = tw(Link)({ base: "group block h-full" })

export const CardContainer = tw.div({ base: "border border-obsidian-800/60 bg-obsidian-900/30 rounded-sm overflow-hidden hover:border-gold-800/50 hover:shadow-[0_4px_24px_rgba(212,168,67,0.08)] transition-all duration-300 flex flex-col h-full" })

export const CardImageArea = tw.div({
  base: "relative aspect-square bg-obsidian-800 overflow-hidden",
  sub: {
    div: {
      placeholderBox: "w-full h-full flex items-center justify-center",
      outOfStockBox: "absolute inset-0 bg-obsidian-950/80 flex items-center justify-center"
    },
    span: {
      outOfStockBadge: "text-xs font-semibold text-red-400 border border-red-800/60 bg-red-900/30 px-3 py-1 rounded-sm"
    }
  }
})

export const CardImage = tw.img({ base: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" })
export const IconCartLarge = tw(ShoppingCart)({ base: "text-obsidian-600" })

export const WishlistBtn = tw.button({
  base: "absolute top-2.5 right-2.5 w-8 h-8 rounded-sm flex items-center justify-center transition-colors",
  variants: {
    active: {
      true: "bg-gold-500/20 text-gold-400 border border-gold-700/50",
      false: "bg-obsidian-900/80 text-obsidian-400 border border-obsidian-700/50 hover:text-gold-400"
    }
  }
})
export const IconHeart = tw(Heart)``

export const CardContentArea = tw.div({
  base: "flex-1 p-4 flex flex-col",
  sub: {
    p: {
      category: "text-xs text-obsidian-600 mb-1.5",
      price: "text-gold-400 font-semibold font-heading text-base mb-3"
    },
    h3: {
      name: "text-sm text-obsidian-200 font-medium line-clamp-2 flex-1 mb-2 min-h-10 group-hover:text-gold-400 transition-colors"
    },
    div: {
      ratingRow: "flex items-center gap-1.5 mb-2",
      starsWrap: "flex items-center"
    },
    span: {
      reviewCount: "text-xs text-obsidian-600"
    }
  }
})

export const IconStar = tw(Star)({
  base: "",
  variants: {
    active: {
      true: "star-filled",
      false: "star-empty"
    }
  }
})

export const CardAddToCartBtn = tw.button({ base: "w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-wide uppercase bg-obsidian-800/80 text-obsidian-300 border border-obsidian-700 hover:bg-gold-500 hover:text-obsidian-950 hover:border-gold-500 active:scale-[0.98] transition-all duration-200 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed" })

export const IconCartSmall = tw(ShoppingCart)``
