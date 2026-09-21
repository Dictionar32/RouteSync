import { tw } from "tailwind-styled-v4"
import Link from "next/link"

export const PageContainer = tw.div({ base: "animate-[fadeIn_0.5s_ease]" })

// Hero
export const HeroSection = tw.section({ base: "relative min-h-[88vh] flex items-center justify-center px-4 overflow-hidden" })
export const RadialGlowWrapper = tw.div({ base: "absolute inset-0 pointer-events-none" })
export const RadialGlow1 = tw.div({ base: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/[0.06] rounded-full blur-3xl" })
export const RadialGlow2 = tw.div({ base: "absolute top-0 right-0 w-[500px] h-[500px] bg-gold-600/[0.04] rounded-full blur-3xl" })
export const RadialGlow3 = tw.div({ base: "absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-400/[0.03] rounded-full blur-3xl" })

export const GridOverlay = tw.div({
  base: "absolute inset-0 opacity-[0.02]",
  style: { 
    backgroundImage: "linear-gradient(#e8c162 1px, transparent 1px), linear-gradient(90deg, #e8c162 1px, transparent 1px)", 
    backgroundSize: "60px 60px" 
  }
})

export const HeroContentWrapper = tw.div({ base: "relative z-10 text-center max-w-3xl mx-auto" })

export const LabelBox = tw.div({ base: "inline-flex items-center gap-2 border border-gold-800/50 bg-gold-500/5 px-4 py-1.5 rounded-sm mb-8 animate-[slideUp_0.5s_ease_0.1s_both]" })
export const LabelText = tw.span({ base: "text-xs font-semibold text-gold-400 tracking-widest uppercase" })
export const StyledGemIcon = tw.div({ base: "text-gold-500 flex" })

export const HeroTitle = tw.h1({ base: "font-heading text-5xl md:text-7xl text-obsidian-50 leading-[0.95] mb-6 animate-[slideUp_0.5s_ease_0.2s_both]" })
export const HeroTitleGradient = tw.span({ base: "text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600" })

export const HeroDesc = tw.p({ base: "text-obsidian-400 text-lg leading-relaxed mb-10 max-w-xl mx-auto animate-[slideUp_0.5s_ease_0.3s_both]" })

export const HeroBtnGroup = tw.div({ base: "flex items-center justify-center gap-4 flex-wrap animate-[slideUp_0.5s_ease_0.4s_both]" })
export const PrimaryBtn = tw(Link)({ base: "btn-gold flex items-center gap-2" })
export const SecondaryBtn = tw(Link)({ base: "btn-outline" })

export const StatsGrid = tw.div({ base: "grid grid-cols-3 gap-6 mt-16 pt-12 border-t border-obsidian-800/60 animate-[slideUp_0.5s_ease_0.5s_both]" })
export const StatBox = tw.div({ base: "text-center" })
export const StatValue = tw.p({ base: "font-heading text-2xl text-gold-400" })
export const StatLabel = tw.p({ base: "text-xs text-obsidian-500 mt-1" })

export const GoldDividerBox = tw.div({ base: "gold-divider mx-8" })

// Features
export const FeaturesSection = tw.section({ base: "py-24 px-4" })
export const FeaturesWrapper = tw.div({ base: "max-w-5xl mx-auto" })
export const FeaturesHeader = tw.div({ base: "text-center mb-14" })
export const FeaturesSubtitle = tw.p({ base: "text-xs font-semibold text-gold-500 tracking-widest uppercase mb-3" })
export const FeaturesTitle = tw.h2({ base: "section-title" })
export const FeaturesGrid = tw.div({ base: "grid sm:grid-cols-2 lg:grid-cols-4 gap-5" })

export const FeatureCard = tw.div({ base: "card-dark p-6 hover:border-gold-800/40 hover:shadow-[0_4px_24px_rgba(212,168,67,0.07)] hover:-translate-y-1 transition-all duration-300 group" })
export const FeatureIconBox = tw.div({ base: "w-11 h-11 rounded-sm bg-gold-500/10 border border-gold-800/40 flex items-center justify-center mb-5 group-hover:bg-gold-500/20 group-hover:border-gold-700/50 transition-colors text-gold-400" })
export const FeatureTitle = tw.h3({ base: "font-heading text-base text-obsidian-100 mb-2" })
export const FeatureDesc = tw.p({ base: "text-xs text-obsidian-500 leading-relaxed" })

// CTA Banner
export const CtaSection = tw.section({ base: "py-6 px-4 pb-24" })
export const CtaWrapper = tw.div({ base: "max-w-5xl mx-auto" })
export const CtaBox = tw.div({ base: "relative overflow-hidden rounded-sm border border-gold-800/40 bg-gradient-to-br from-obsidian-900 via-obsidian-900 to-gold-500/5 p-12 text-center" })
export const CtaPattern = tw.div({
  base: "absolute inset-0 opacity-[0.03]",
  style: { backgroundImage: "radial-gradient(circle, #d4a843 1px, transparent 1px)", backgroundSize: "24px 24px" }
})
export const CtaSubtitle = tw.p({ base: "text-xs font-semibold text-gold-500 tracking-widest uppercase mb-3 relative" })
export const CtaTitle = tw.h2({ base: "font-heading text-4xl text-obsidian-50 mb-4 relative" })
export const CtaDesc = tw.p({ base: "text-obsidian-400 text-sm mb-8 relative max-w-md mx-auto" })
export const CtaBtn = tw(Link)({ base: "btn-gold inline-flex items-center gap-2 relative" })
