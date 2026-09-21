import { tw } from "tailwind-styled-v4"
import { Button } from "@/components/ui/button"

// auth-guard
export const AuthGuardContainer = tw.div({ base: "min-h-screen flex items-center justify-center px-4" })
export const AuthGuardContent = tw.div({ base: "text-center" })
export const AuthGuardIconBox = tw.div({ base: "w-16 h-16 rounded-sm bg-gold-500/10 border border-gold-800/40 flex items-center justify-center mx-auto mb-5 text-gold-400" })
export const AuthGuardTitle = tw.h2({ base: "font-heading text-xl text-obsidian-100 mb-2" })
export const AuthGuardDesc = tw.p({ base: "text-obsidian-500 text-sm mb-6" })
export const AuthGuardBtn = tw(Button)({ base: "btn-gold" })

// empty-state
export const EmptyStateContainer = tw.div({ base: "flex flex-col items-center justify-center py-12 px-4 text-center" })
export const EmptyStateIconBox = tw.div({ base: "text-5xl mb-4 text-gray-300 flex justify-center" })
export const EmptyStateTitle = tw.h3({ base: "text-lg font-semibold text-gray-900 mb-2" })
export const EmptyStateDesc = tw.p({ base: "text-gray-500 mb-6 max-w-sm" })
export const EmptyStateActionBtn = tw(Button)({ base: "bg-blue-600 hover:bg-blue-700" })

// error-state
export const ErrorStateContainer = tw.div({ base: "flex flex-col items-center justify-center py-12 px-4 text-center" })
export const ErrorStateIconBox = tw.div({ base: "text-red-500 mb-4 flex justify-center" })
export const ErrorStateTitle = tw.h3({ base: "text-lg font-semibold text-gray-900 mb-2" })
export const ErrorStateDesc = tw.p({ base: "text-gray-500 mb-6 max-w-sm" })
export const ErrorStateActionBtn = tw(Button)({ base: "bg-blue-600 hover:bg-blue-700" })

// page-loader
export const PageLoaderContainer = tw.div({ base: "flex flex-col items-center justify-center min-h-[50vh] py-12" })
export const PageLoaderSpinnerBox = tw.div({ base: "text-blue-600 mb-4 flex justify-center" })
export const PageLoaderText = tw.p({ base: "text-gray-500 text-sm" })
