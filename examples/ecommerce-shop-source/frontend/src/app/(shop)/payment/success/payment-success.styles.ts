import { tw } from "tailwind-styled-v4"

export const PageContainer = tw.div({ base: "min-h-screen flex items-center justify-center px-4 py-12 animate-[fadeIn_0.5s_ease]" })
export const ContentWrapper = tw.div({ base: "max-w-md w-full" })
export const CardBox = tw.div({ base: "relative card-dark p-10 text-center overflow-hidden" })

// Corner accents
export const CornerTL = tw.div({ base: "absolute top-0 left-0 w-14 h-14 border-t-2 border-l-2 border-gold-500/60" })
export const CornerTR = tw.div({ base: "absolute top-0 right-0 w-14 h-14 border-t-2 border-r-2 border-gold-500/60" })
export const CornerBL = tw.div({ base: "absolute bottom-0 left-0 w-14 h-14 border-b-2 border-l-2 border-gold-500/60" })
export const CornerBR = tw.div({ base: "absolute bottom-0 right-0 w-14 h-14 border-b-2 border-r-2 border-gold-500/60" })

export const RadialBg = tw.div({ base: "absolute inset-0 bg-gradient-to-b from-emerald-900/5 to-transparent pointer-events-none" })

export const InnerContainer = tw.div({ base: "relative" })
export const IconBox = tw.div({ base: "w-20 h-20 rounded-sm bg-emerald-900/20 border border-emerald-800/40 flex items-center justify-center mx-auto mb-6" })
export const Subtitle = tw.p({ base: "text-xs font-semibold text-gold-500 tracking-widest uppercase mb-3" })
export const Title = tw.h1({ base: "font-heading text-3xl text-obsidian-50 mb-3" })
export const Desc = tw.p({ base: "text-obsidian-400 text-sm leading-relaxed mb-6" })

export const OrderInfoBox = tw.div({ base: "bg-obsidian-900/60 border border-obsidian-700/40 rounded-sm p-5 mb-6 text-left space-y-3" })
export const InfoRow = tw.div({ base: "flex items-center justify-between" })
export const InfoLabel = tw.span({ base: "text-xs text-obsidian-500" })
export const InvoiceValue = tw.span({ base: "font-heading text-gold-400 font-semibold" })
export const OrderIdValue = tw.span({ base: "text-sm text-obsidian-300" })
export const StatusBadgeStyle = tw.span({ base: "badge border-emerald-800/60 bg-emerald-900/20 text-emerald-400 capitalize" })

export const BtnGroup = tw.div({ base: "flex flex-col gap-3" })
