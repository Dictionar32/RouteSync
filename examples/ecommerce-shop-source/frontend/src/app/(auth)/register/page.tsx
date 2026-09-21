"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { z } from "zod"

import {
  Form, FormField, FormItem,
  FormControl, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { commonSchemas } from "@/lib/core/validation"
import {
  AuthSplitContainer, AuthLeftPanel, AuthLeftBg1, AuthLeftBg2, AuthLeftBg3, AuthLeftContent,
  AuthLogo, AuthLogoHighlight, AuthDivider, AuthQuote, AuthQuoteSubtitle,
  StatsGrid, StatNum, StatLabel,
  AuthRightPanel, AuthRightInner, AuthMobileLogo, AuthHeader, AuthTitle, AuthSubtitle,
  OAuthBtn, OrDividerBox, OrDividerLine, OrDividerText,
  FormLabelText, SubmitBtn, SubmitSpinner, TermsText, TermsHighlight, BottomText, BottomLink
} from "../auth.styles"

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: commonSchemas.email,
  password: commonSchemas.password,
  passwordConfirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((d) => d.password === d.passwordConfirmation, {
  message: "Password tidak cocok",
  path: ["passwordConfirmation"],
})

type RegisterFormValues = z.infer<typeof RegisterSchema>

const DefaultValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
}

import { useRegister } from '@/api/hooks'

export default function RegisterPage() {
  const registerMutation = useRegister.useCreate()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: DefaultValues,
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync(values)
      toast.success("Akun dibuat! Selamat datang.")
      window.location.href = "/"
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Gagal mendaftar")
    }
  }

  const handleOAuth = (provider: string) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/oauth/${provider}/redirect`
  }

  return (
    <AuthSplitContainer>

      {/* Left Panel */}
      <AuthLeftPanel>
        <AuthLeftBg1 />
        <AuthLeftBg2 />
        <AuthLeftBg3 />
        <AuthLeftContent>
          <AuthLogo href="/">
            KUN<AuthLogoHighlight>PULAN</AuthLogoHighlight>
          </AuthLogo>
          <AuthDivider />
          <AuthQuote>
            &ldquo;Bergabunglah dengan<br />komunitas premium kami.&rdquo;
          </AuthQuote>
          <StatsGrid>
            {[["10K+", "Produk"], ["50K+", "Member"], ["4.9", "Rating"]].map(([num, label]) => (
              <div key={label}>
                <StatNum>{num}</StatNum>
                <StatLabel>{label}</StatLabel>
              </div>
            ))}
          </StatsGrid>
        </AuthLeftContent>
      </AuthLeftPanel>

      {/* Right Panel */}
      <AuthRightPanel>
        <AuthRightInner>

          <AuthMobileLogo href="/">
            KUN<AuthLogoHighlight>PULAN</AuthLogoHighlight>
          </AuthMobileLogo>

          <AuthHeader>
            <AuthTitle>Buat Akun</AuthTitle>
            <AuthSubtitle>Mulai belanja premium hari ini</AuthSubtitle>
          </AuthHeader>

          {/* OAuth */}
          <OAuthBtn type="button" onClick={() => handleOAuth("google")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Daftar dengan Google
          </OAuthBtn>

          <OrDividerBox>
            <OrDividerLine />
            <OrDividerText>atau</OrDividerText>
            <OrDividerLine />
          </OrDividerBox>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField name="name" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabelText as="div">Nama Lengkap</FormLabelText>
                  <FormControl>
                    <Input placeholder="Nama kamu" className="input-dark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="email" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabelText as="div">Email</FormLabelText>
                  <FormControl>
                    <Input type="email" placeholder="nama@email.com" className="input-dark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="password" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabelText as="div">Password</FormLabelText>
                  <FormControl>
                    <Input type="password" placeholder="Min. 6 karakter" className="input-dark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="passwordConfirmation" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabelText as="div">Konfirmasi Password</FormLabelText>
                  <FormControl>
                    <Input type="password" placeholder="Ulangi password" className="input-dark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <TermsText>
                Dengan mendaftar, Anda menyetujui{" "}
                <TermsHighlight>Syarat & Ketentuan</TermsHighlight> kami.
              </TermsText>

              <SubmitBtn type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <SubmitSpinner />
                ) : (
                  <>
                    <UserPlus size={16} />
                    Buat Akun
                  </>
                )}
              </SubmitBtn>

            </form>
          </Form>

          <BottomText>
            Sudah punya akun?{" "}
            <BottomLink href="/login">
              Masuk
            </BottomLink>
          </BottomText>

        </AuthRightInner>
      </AuthRightPanel>
    </AuthSplitContainer>
  )
}