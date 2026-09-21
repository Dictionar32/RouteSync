import { tw } from "tailwind-styled-v4"
import { Button } from "@/components/ui/button"

export const ErrorContainer = tw.div({ base: "flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center" })
export const ErrorContent = tw.div({ base: "space-y-2" })
export const ErrorTitle = tw.h2({ base: "text-2xl font-semibold text-obsidian-100" })
export const ErrorMessage = tw.p({ base: "text-obsidian-400" })
export const ErrorDigest = tw.p({ base: "text-sm text-obsidian-600" })
export const TryAgainBtn = tw(Button)({ base: "btn-gold mt-4" })
