import { tw } from "tailwind-styled-v4"
import Link from "next/link"

export const Header = tw.header({ base: "sticky top-0 z-50 w-full border-b border-obsidian-800/80 bg-obsidian-950/95 backdrop-blur-md" })
export const Container = tw.div({ base: "max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-8" })

export const LogoLink = tw(Link)({ base: "flex items-center gap-2" })
export const LogoText = tw.span({ base: "font-heading text-xl text-gold-400 tracking-widest uppercase" })

export const DesktopNav = tw.nav({ base: "hidden md:flex items-center gap-8" })
export const DesktopNavLink = tw(Link)({
  base: "text-sm transition-colors relative pb-0.5 group",
  variants: {
    active: {
      "true": "text-gold-400 font-medium",
      "false": "text-obsidian-400 hover:text-obsidian-100"
    }
  }
})
export const DesktopNavUnderline = tw.span({
  base: "absolute -bottom-1 left-0 h-px bg-gold-500 transition-all duration-300",
  variants: {
    active: {
      "true": "w-full",
      "false": "w-0 group-hover:w-full opacity-60"
    }
  }
})
export const DesktopActions = tw.div({ base: "hidden md:flex items-center gap-3" })

export const IconButton = tw.button({ base: "relative p-2 text-obsidian-400 hover:text-gold-400 transition-colors" })
export const IconLink = tw(Link)({ base: "p-2 text-obsidian-400 hover:text-gold-400 transition-colors" })

export const CartBadge = tw.span({ base: "absolute -top-0.5 -right-0.5 min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full bg-gold-500 text-obsidian-950 text-[10px] font-bold" })

export const UserMenuContainer = tw.div({ base: "relative" })
export const UserMenuTrigger = tw.button({ base: "flex items-center gap-2 px-3 py-1.5 border border-obsidian-700 hover:border-gold-600 rounded-sm text-sm text-obsidian-300 hover:text-gold-400 transition-colors" })
export const UserName = tw.span({ base: "max-w-[80px] truncate" })

export const Dropdown = tw.div({ base: "absolute right-0 mt-1 w-48 bg-obsidian-900 border border-obsidian-700 rounded-sm shadow-xl z-[60] overflow-hidden" })
export const DropdownLink = tw(Link)({ base: "flex items-center gap-3 px-4 py-3 text-sm text-obsidian-300 hover:bg-obsidian-800 hover:text-obsidian-100 transition-colors" })
export const DropdownDivider = tw.div({ base: "border-t border-obsidian-800" })
export const DropdownLogout = tw.button({ base: "flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-obsidian-800 transition-colors w-full text-left" })

export const LoginLink = tw(Link)({ base: "px-4 py-1.5 bg-gold-500 text-obsidian-950 text-sm font-semibold hover:bg-gold-400 transition-colors rounded-sm" })

export const MobileActions = tw.div({ base: "flex md:hidden items-center gap-2" })
export const MobileMenuOverlay = tw.div({ base: "border-t border-obsidian-800 md:hidden" })
export const MobileNav = tw.nav({ base: "max-w-7xl mx-auto flex flex-col px-4 py-3" })
export const MobileNavLinkItem = tw(Link)({
  base: "py-3 text-sm border-b border-obsidian-900 transition-colors",
  variants: {
    active: {
      "true": "text-gold-400 font-medium",
      "false": "text-obsidian-400 hover:text-obsidian-100"
    }
  }
})

export const MobileActionRow = tw.div({ base: "pt-3 flex gap-2" })
export const MobileProfileLink = tw(Link)({ base: "flex-1 py-2 text-center border border-obsidian-700 text-obsidian-300 text-sm rounded-sm" })
export const MobileLogoutButton = tw.button({ base: "flex-1 py-2 text-center border border-red-800/60 text-red-400 text-sm rounded-sm" })
export const MobileLoginLink = tw(Link)({ base: "flex-1 py-2 text-center bg-gold-500 text-obsidian-950 text-sm font-semibold rounded-sm" })

export const ClickOutsideLayer = tw.div({ base: "fixed inset-0 z-[55]" })
