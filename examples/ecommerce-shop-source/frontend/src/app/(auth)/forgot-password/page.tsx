"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Mail, ArrowLeft, Check } from "lucide-react"

import {
  Form, FormField, FormItem,
  FormControl, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { commonSchemas } from "@/lib/core/validation"
import {
  AuthCenteredContainer, BackLink, ForgotCard,
  SuccessStateBox, SuccessIconBox, SuccessTitle, SuccessDesc, SuccessHighlight, ResendBtn,
  ForgotIconBox, ForgotTitle, ForgotSubtitle,
  FormLabelText, SubmitBtn, SubmitSpinner
} from "../auth.styles"

const ForgotPasswordSchema = z.object({
  email: commonSchemas.email,
})

type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>

const DefaultValues: ForgotPasswordFormValues = {
  email: "",
}

import { useForgotPassword } from '@/api/hooks'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const forgotMutation = useForgotPassword.useCreate()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      ...DefaultValues,
      email: searchParams.get("email") ?? "",
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgotMutation.mutateAsync(values)
      setSentEmail(values.email)
      setSent(true)
      toast.success("Email reset password telah dikirim")
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Gagal mengirim email")
    }
  }

  return (
    <AuthCenteredContainer>
      <div className="w-full max-w-md animate-fade-in">

        <BackLink href="/login">
          <ArrowLeft size={14} />
          Kembali ke Login
        </BackLink>

        <ForgotCard>
          {sent ? (
            // Success state
            <SuccessStateBox>
              <SuccessIconBox>
                <Check size={28} className="text-gold-400" />
              </SuccessIconBox>
              <SuccessTitle>Email Dikirim!</SuccessTitle>
              <SuccessDesc>
                Kami telah mengirim link reset password ke{" "}
                <SuccessHighlight>{sentEmail}</SuccessHighlight>.
                Periksa inbox atau folder spam Anda.
              </SuccessDesc>
              <ResendBtn onClick={() => setSent(false)}>
                Kirim Ulang
              </ResendBtn>
            </SuccessStateBox>
          ) : (
            // Form state
            <>
              <div className="mb-8">
                <ForgotIconBox>
                  <Mail size={22} className="text-gold-400" />
                </ForgotIconBox>
                <ForgotTitle>Lupa Password?</ForgotTitle>
                <ForgotSubtitle>
                  Masukkan email Anda dan kami akan mengirimkan link reset password.
                </ForgotSubtitle>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  <FormField name="email" control={form.control} render={({ field }) => (
                    <FormItem>
                      <FormLabelText as="div">Email</FormLabelText>
                      <FormControl>
                        <Input type="email" placeholder="nama@email.com" className="input-dark" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <SubmitBtn type="submit" disabled={forgotMutation.isPending}>
                    {forgotMutation.isPending ? (
                      <SubmitSpinner />
                    ) : (
                      <>
                        <Mail size={16} />
                        Kirim Link Reset
                      </>
                    )}
                  </SubmitBtn>

                </form>
              </Form>
            </>
          )}
        </ForgotCard>

      </div>
    </AuthCenteredContainer>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}