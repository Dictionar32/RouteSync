import { tw } from "tailwind-styled-v4"
import Link from "next/link"

export const PageContainer = tw.div({ base: "min-h-screen py-10 px-4 animate-[fadeIn_0.4s_ease]" })
export const ContentWrapper = tw.div({ base: "max-w-2xl mx-auto" })

export const AvatarCard = tw.div({ base: "card-dark p-8 mb-5" })
export const AvatarHeaderRow = tw.div({ base: "flex items-center gap-5 mb-6 pb-6 border-b border-obsidian-800" })
export const AvatarBox = tw.div({ base: "w-16 h-16 rounded-sm bg-gradient-to-br from-gold-600/30 to-gold-400/10 border border-gold-700/40 flex items-center justify-center text-gold-400 font-heading font-bold text-2xl shrink-0" })
export const AvatarInfoBox = tw.div({ base: "flex-1" })
export const UserName = tw.h2({ base: "font-heading text-xl text-obsidian-50" })
export const UserEmail = tw.p({ base: "text-obsidian-500 text-sm" })
export const MemberBadge = tw.span({ base: "badge border-gold-800/50 bg-gold-500/10 text-gold-400 mt-2" })

export const FormWrapper = tw.form({ base: "space-y-4" })
export const LabelStyle = tw.span({ base: "text-xs font-semibold text-obsidian-400 uppercase tracking-widest" })
export const ActionBtnGroup = tw.div({ base: "flex gap-3 pt-2" })

export const InfoListWrapper = tw.div({ base: "space-y-3" })
export const InfoItemBox = tw.div({ base: "flex items-center gap-4 p-4 bg-obsidian-900/50 border border-obsidian-800/50 rounded-sm" })
export const InfoIconBox = tw.div({ base: "w-8 h-8 rounded-sm bg-obsidian-800 flex items-center justify-center shrink-0" })
export const InfoLabelText = tw.p({ base: "text-xs text-obsidian-500 uppercase tracking-wider" })
export const InfoValueText = tw.p({
  base: "text-sm font-medium mt-0.5",
  variants: {
    color: {
      default: "text-obsidian-200",
      emerald: "text-emerald-400"
    }
  }
})

export const NavCard = tw.div({ base: "card-dark divide-y divide-obsidian-800 mb-5" })
export const NavLinkItem = tw(Link)({ base: "flex items-center gap-4 p-5 hover:bg-obsidian-800/20 transition-colors group" })
export const NavIconBox = tw.div({ base: "w-9 h-9 rounded-sm bg-obsidian-800 border border-obsidian-700/60 flex items-center justify-center shrink-0 group-hover:border-gold-700/50 transition-colors" })
export const NavContentBox = tw.div({ base: "flex-1" })
export const NavTitle = tw.p({ base: "text-sm font-medium text-obsidian-200" })
export const NavDesc = tw.p({ base: "text-xs text-obsidian-500" })
