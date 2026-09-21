import { tw } from "tailwind-styled-v4"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, CreditCard, Lock, Package, ArrowLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

export const PageContainer = tw.div`min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]`
export const ContentWrapper = tw.div`max-w-5xl mx-auto`

export const BackLink = tw(Link)({
  base: "inline-flex items-center gap-2 text-xs text-obsidian-500 hover:text-obsidian-300 transition-colors mb-6",
})

export const GridContainer = tw.div`grid lg:grid-cols-[1fr_360px] gap-8`

// --- UI Wrappers ---
export const IconArrowLeft = tw(ArrowLeft)``
export const IconChevronRight = tw(ChevronRight)``
export const IconMapPin = tw(MapPin)`text-gold-500`
export const IconCreditCard = tw(CreditCard)`text-gold-500`
export const IconLock = tw(Lock)`text-obsidian-600`
export const IconLockSubmit = tw(Lock)``
export const IconPackage = tw(Package)`text-gold-500`
export const IconLoader = tw(Loader2)`animate-spin`

export const StyledInput = tw(Input)`input-dark`
export const StyledTextarea = tw(Textarea)`input-dark resize-none`
export const SkelOrder = tw(Skeleton)`h-14 bg-obsidian-800`
export const StyledSeparator = tw(Separator)``

export const SubmitBtn = tw(Button)`btn-gold w-full flex items-center justify-center gap-2 mt-2`
export const PaymentBtn = tw(Button)`btn-gold w-full flex items-center justify-center gap-2 h-12 text-base`

export const SummaryAddressChangeBtn = tw.button`text-xs text-obsidian-500 hover:text-gold-400 transition-colors underline underline-offset-2`
export const OrderItemImg = tw.img`w-full h-full object-cover`

// --- Step 1 ---
export const Step1Card = tw.div({
  base: "card-dark p-6 animate-[fadeIn_0.3s_ease]",
  sub: {
    div: { header: "flex items-center gap-2 mb-6 pb-4 border-b border-obsidian-800" },
    h2: { title: "font-heading text-lg text-obsidian-100" },
    form: { formEl: "space-y-5" },
    label: { label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest block" },
  }
})

export const FormGrid = tw.div`grid grid-cols-2 gap-4`

// --- Step 2 ---
export const Step2Wrapper = tw.div`space-y-4 animate-[fadeIn_0.3s_ease]`

export const SummaryAddressCard = tw.div({
  base: "card-dark p-4",
  sub: {
    div: {
      header: "flex items-center justify-between mb-3",
      headerLeft: "flex items-center gap-2"
    },
    p: {
      label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest",
      name: "text-sm font-semibold text-obsidian-200",
      address: "text-sm text-obsidian-400 mt-0.5",
      city: "text-sm text-obsidian-400",
      phone: "text-xs text-obsidian-500 mt-1"
    },
  }
})

// --- Payment Method Card ---
export const PaymentCard = tw.div({
  base: "card-dark p-5",
  sub: {
    div: {
      header: "flex items-center gap-2 mb-4 pb-3 border-b border-obsidian-800",
      list: "space-y-2.5",
      securityInfo: "mt-5 pt-4 border-t border-obsidian-800 flex items-center gap-2"
    },
    p: {
      label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest",
      securityText: "text-xs text-obsidian-600"
    },
  }
})

export const PaymentMethodBtn = tw.button({
  base: "w-full flex items-center gap-4 p-4 rounded-sm border text-left transition-all duration-150",
  variants: {
    selected: {
      true: "border-gold-700/70 bg-gold-500/5",
      false: "border-obsidian-800/60 hover:border-obsidian-700 hover:bg-obsidian-800/20"
    }
  },
  sub: {
    div: { content: "flex-1" }
  }
})

export const PaymentMethodIconBox = tw.div({
  base: "w-10 h-10 rounded-sm flex items-center justify-center shrink-0 transition-colors",
  variants: {
    selected: {
      true: "bg-gold-500/20 border border-gold-700/40",
      false: "bg-obsidian-800 border border-obsidian-700/40"
    }
  }
})

export const PaymentMethodTitle = tw.p({
  base: "text-sm font-semibold",
  variants: {
    selected: {
      true: "text-obsidian-100",
      false: "text-obsidian-300"
    }
  }
})

export const PaymentMethodDesc = tw.p`text-xs text-obsidian-500 mt-0.5`

export const PaymentRadioCircle = tw.div({
  base: "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
  variants: {
    selected: {
      true: "border-gold-500",
      false: "border-obsidian-600"
    }
  }
})

export const PaymentRadioDot = tw.div`w-2 h-2 rounded-full bg-gold-500`

// --- Right Side: Order Summary ---
export const OrderSummaryCard = tw.div({
  base: "card-dark p-5 h-fit",
  sub: {
    div: {
      header: "flex items-center gap-2 mb-4 pb-3 border-b border-obsidian-800",
      skelWrapper: "space-y-2.5",
      list: "space-y-3 max-h-72 overflow-y-auto mb-4",
      itemRow: "flex items-center gap-3",
      imgWrapper: "w-12 h-12 shrink-0 bg-obsidian-800 rounded-sm overflow-hidden border border-obsidian-700/40",
      itemInfo: "flex-1 min-w-0"
    },
    p: {
      label: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest",
      name: "text-xs text-obsidian-300 truncate",
      desc: "text-xs text-obsidian-500",
      subtotal: "text-xs font-semibold text-obsidian-200 shrink-0"
    },
    img: { image: "w-full h-full object-cover" },
  }
})

// --- Totals ---
export const TotalsList = tw.div({
  base: "space-y-2 text-sm",
  sub: {
    div: {
      row: "flex justify-between text-obsidian-400",
      discountRow: "flex justify-between text-gold-500"
    },
    span: { label: "", value: "" }
  }
})

export const GrandTotalWrapper = tw.div({
  base: "flex justify-between font-bold text-base",
  sub: {
    span: { label: "text-obsidian-100 font-heading", value: "text-gold-400 font-heading" }
  }
})

export const InvoiceWrapper = tw.div({
  base: "mt-4 pt-4 border-t border-obsidian-800",
  sub: {
    p: { label: "text-xs text-obsidian-500 mb-1", value: "font-heading text-gold-400 font-semibold" }
  }
})

// --- Step Indicator ---
export const StepIndicatorContainer = tw.div`flex items-center gap-3 mb-8`
export const StepItemWrapper = tw.div`flex items-center gap-3`
export const StepInnerWrapper = tw.div`flex items-center gap-2`

export const StepLine = tw.div({
  base: "h-px w-8",
  variants: {
    passed: {
      true: "bg-gold-500",
      false: "bg-obsidian-700"
    }
  }
})

export const StepCircle = tw.div({
  base: "w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold transition-colors",
  variants: {
    status: {
      current: "bg-gold-500 text-obsidian-950",
      passed: "bg-gold-500/20 border border-gold-700/40 text-gold-400",
      upcoming: "bg-obsidian-800 border border-obsidian-700 text-obsidian-500"
    }
  }
})

export const StepLabel = tw.span({
  base: "text-xs font-semibold uppercase tracking-wide",
  variants: {
    status: {
      current: "text-gold-400",
      passed: "text-obsidian-400",
      upcoming: "text-obsidian-600"
    }
  }
})
