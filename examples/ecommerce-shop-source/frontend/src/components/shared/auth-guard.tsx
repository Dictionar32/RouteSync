"use client"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { AuthGuardContainer, AuthGuardContent, AuthGuardIconBox, AuthGuardTitle, AuthGuardDesc, AuthGuardBtn } from "./shared.styles"

interface AuthGuardProps {
  icon: LucideIcon
  title: string
  description?: string
}

export function AuthGuard({ icon: Icon, title, description }: AuthGuardProps) {
  const router = useRouter()
  return (
    <AuthGuardContainer>
      <AuthGuardContent>
        <AuthGuardIconBox>
          <Icon size={28} />
        </AuthGuardIconBox>
        <AuthGuardTitle>{title}</AuthGuardTitle>
        {description && <AuthGuardDesc>{description}</AuthGuardDesc>}
        <AuthGuardBtn onClick={() => router.push("/login")}>Masuk Sekarang</AuthGuardBtn>
      </AuthGuardContent>
    </AuthGuardContainer>
  )
}
