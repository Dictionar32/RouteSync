import { tw } from "tailwind-styled-v4"
import Link from "next/link"

// Split Layout (Login & Register)
export const AuthSplitContainer = tw.div({ base: "min-h-screen flex" })

export const AuthLeftPanel = tw.div({ base: "hidden lg:flex lg:w-1/2 relative overflow-hidden" })
export const AuthLeftBg1 = tw.div({ base: "absolute inset-0 bg-linear-to-br from-obsidian-900 via-obsidian-950 to-black" })
export const AuthLeftBg2 = tw.div({ 
  base: "absolute inset-0 opacity-10",
  style: { backgroundImage: "linear-gradient(#d4a843 1px, transparent 1px), linear-gradient(90deg, #d4a843 1px, transparent 1px)", backgroundSize: "60px 60px" }
})
export const AuthLeftBg3 = tw.div({ base: "absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" })
export const AuthLeftContent = tw.div({ base: "relative flex flex-col items-center justify-center w-full px-16 text-center" })

export const AuthLogo = tw(Link)({ base: "font-heading text-4xl font-bold mb-2" })
export const AuthLogoHighlight = tw.span({ base: "text-gold-500" })

export const AuthDivider = tw.div({ base: "h-px w-24 bg-gold-500/40 my-6" })
export const AuthQuote = tw.p({ base: "text-obsidian-300 text-lg font-heading italic" })
export const AuthQuoteSubtitle = tw.p({ base: "text-obsidian-600 text-sm mt-4" })

export const StatsGrid = tw.div({ base: "mt-8 grid grid-cols-3 gap-4 text-center" })
export const StatNum = tw.p({ base: "font-heading text-2xl text-gold-400" })
export const StatLabel = tw.p({ base: "text-obsidian-600 text-xs uppercase tracking-widest mt-0.5" })

export const AuthRightPanel = tw.div({ base: "flex-1 flex items-center justify-center px-6 bg-obsidian-950" })
export const AuthRightInner = tw.div({ base: "w-full max-w-md animate-fade-in" })

export const AuthMobileLogo = tw(Link)({ base: "lg:hidden block font-heading text-3xl font-bold text-center mb-8" })

export const AuthHeader = tw.div({ base: "mb-8" })
export const AuthTitle = tw.h1({ base: "font-heading text-3xl text-obsidian-50" })
export const AuthSubtitle = tw.p({ base: "text-obsidian-500 text-sm mt-1" })

export const OAuthBtn = tw.button({ base: "w-full flex items-center justify-center gap-3 bg-obsidian-900 hover:bg-obsidian-800 border border-obsidian-700 text-obsidian-200 py-3 rounded-sm transition-colors text-sm mb-6" })

export const OrDividerBox = tw.div({ base: "flex items-center gap-4 mb-6" })
export const OrDividerLine = tw.div({ base: "flex-1 h-px bg-obsidian-800" })
export const OrDividerText = tw.span({ base: "text-obsidian-600 text-xs tracking-widest uppercase" })

export const FormLabelText = tw.span({ base: "text-obsidian-400 text-xs tracking-widest uppercase" })
export const ForgotPassLink = tw(Link)({ base: "text-xs text-gold-600 hover:text-gold-400 transition-colors" })
export const SubmitBtn = tw.button({ base: "btn-gold w-full flex items-center justify-center gap-2 mt-2" })
export const SubmitSpinner = tw.div({ base: "w-4 h-4 border-2 border-obsidian-900/30 border-t-obsidian-900 rounded-full animate-spin" })

export const TermsText = tw.p({ base: "text-obsidian-600 text-xs" })
export const TermsHighlight = tw.span({ base: "text-gold-600" })

export const BottomText = tw.p({ base: "text-center text-obsidian-500 text-sm mt-6" })
export const BottomLink = tw(Link)({ base: "text-gold-400 hover:text-gold-300 transition-colors" })

// Centered Layout (Forgot Password)
export const AuthCenteredContainer = tw.div({ base: "min-h-screen flex items-center justify-center bg-obsidian-950 px-6" })
export const BackLink = tw(Link)({ base: "inline-flex items-center gap-2 text-obsidian-500 hover:text-gold-400 transition-colors text-sm mb-10" })
export const ForgotCard = tw.div({ base: "card-dark p-8" })

export const SuccessStateBox = tw.div({ base: "text-center py-4" })
export const SuccessIconBox = tw.div({ base: "w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6" })
export const SuccessTitle = tw.h2({ base: "font-heading text-2xl text-obsidian-50 mb-3" })
export const SuccessDesc = tw.p({ base: "text-obsidian-400 text-sm leading-relaxed" })
export const SuccessHighlight = tw.span({ base: "text-gold-400" })
export const ResendBtn = tw.button({ base: "btn-outline mt-6 text-xs" })

export const ForgotIconBox = tw.div({ base: "w-12 h-12 bg-gold-500/20 rounded-sm flex items-center justify-center mb-4" })
export const ForgotTitle = tw.h1({ base: "font-heading text-2xl text-obsidian-50" })
export const ForgotSubtitle = tw.p({ base: "text-obsidian-500 text-sm mt-2" })
