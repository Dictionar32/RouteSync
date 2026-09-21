import type { Metadata } from "next"
import { Playfair_Display, DM_Sans } from "next/font/google"
import "./globals.css"
import QueryProvider from "./query-provider"
import { Toaster } from "@/components/ui/sonner"
import Navbar from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import CartModal from "@/components/layout/CartModal"
import { StyledBody, AppContainer, MainContent } from "./layout.styles"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "KUNPULAN — Premium E-Commerce",
  description: "Destinasi belanja premium untuk produk berkualitas tinggi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>
        <QueryProvider>
          <AppContainer>
            <Navbar />
            <MainContent>
              {children}
            </MainContent>
            <Footer />
          </AppContainer>
          <CartModal />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
