import { tw } from "tailwind-styled-v4"
import Link from "next/link"

export const FooterContainer = tw.footer({ base: "border-t border-obsidian-800/80 bg-obsidian-950" })
export const GoldAccentLine = tw.div({ base: "h-px bg-gradient-to-r from-transparent via-gold-600/30 to-transparent" })
export const FooterContent = tw.div({ base: "max-w-7xl mx-auto px-4 lg:px-8 py-14" })
export const FooterGrid = tw.div({ base: "grid grid-cols-1 md:grid-cols-4 gap-10" })

export const BrandSection = tw.div({ base: "md:col-span-2" })
export const BrandTitle = tw.h3({ base: "font-heading text-gold-400 tracking-widest uppercase text-xl mb-1" })
export const BrandDivider = tw.div({ base: "h-px w-12 bg-gold-600/40 mb-4" })
export const BrandDesc = tw.p({ base: "text-sm text-obsidian-500 leading-relaxed max-w-xs" })

export const NavSection = tw.div({})
export const NavTitle = tw.h4({ base: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest mb-5" })
export const NavList = tw.ul({ base: "space-y-3" })
export const NavItemLink = tw(Link)({ base: "link-gold text-sm" })

export const BottomBar = tw.div({ base: "mt-12 pt-6 border-t border-obsidian-900 flex flex-col md:flex-row items-center justify-between gap-2" })
export const CopyrightText = tw.p({ base: "text-xs text-obsidian-600" })
export const TechText = tw.p({ base: "text-xs text-obsidian-700" })
