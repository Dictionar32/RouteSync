"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { User, Mail, Shield, LogOut, ShoppingBag, ChevronRight, Loader2, Edit2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { AuthGuard } from "@/components/shared/auth-guard"
import { SectionHeader } from "@/components/shared/section-header"

import useAuthStore from "@/lib/stores/auth-store"
import { useLogout, useProfile } from '@/api/hooks'
import {
  PageContainer, ContentWrapper, AvatarCard, AvatarHeaderRow, AvatarBox, AvatarInfoBox, UserName, UserEmail, MemberBadge,
  FormWrapper, LabelStyle, ActionBtnGroup, InfoListWrapper, InfoItemBox, InfoIconBox, InfoLabelText, InfoValueText,
  NavCard, NavLinkItem, NavIconBox, NavContentBox, NavTitle, NavDesc
} from "./profile.styles"

const UpdateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
})

type UpdateFormValues = z.infer<typeof UpdateSchema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const logoutLocal = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const logoutMutation = useLogout.useCreate()
  const updateProfile = useProfile.usePatch()
  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(UpdateSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "" },
  })

  const onSubmit = async (values: UpdateFormValues) => {
    try {
      await updateProfile.mutateAsync(values)
      toast.success("Profil berhasil diperbarui")
      setIsEditing(false)
    } catch {
      toast.error("Gagal memperbarui profil")
    }
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => { 
        logoutLocal()
        toast.success("Berhasil keluar") 
      },
      onError: () => { 
        logoutLocal()
        toast.error("Gagal keluar") 
      },
    })
  }

  if (!isAuthenticated) {
    return <AuthGuard icon={User} title="Masuk untuk melihat profil" description="Kelola akun dan preferensi Anda" />
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <SectionHeader label="Akun Saya" title="Profil" />

        {/* Avatar card */}
        <AvatarCard>
          <AvatarHeaderRow>
            <AvatarBox>
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarBox>
            <AvatarInfoBox>
              <UserName>{user?.name}</UserName>
              <UserEmail>{user?.email}</UserEmail>
              <MemberBadge>Member</MemberBadge>
            </AvatarInfoBox>
            <Button variant="ghost" size="icon"
              className="text-obsidian-500 hover:text-gold-400 transition-colors"
              onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            </Button>
          </AvatarHeaderRow>

          {isEditing ? (
            <Form {...form}>
              <FormWrapper onSubmit={form.handleSubmit(onSubmit)}>
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel><LabelStyle>Nama</LabelStyle></FormLabel>
                    <FormControl>
                      <Input placeholder="Nama lengkap" className="input-dark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="email" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel><LabelStyle>Email</LabelStyle></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="nama@email.com" className="input-dark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <ActionBtnGroup>
                  <Button type="submit" disabled={updateProfile.isPending} className="btn-gold flex-1">
                    {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : "Simpan Perubahan"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setIsEditing(false); form.reset() }}
                    className="btn-outline flex-1">
                    Batal
                  </Button>
                </ActionBtnGroup>
              </FormWrapper>
            </Form>
          ) : (
            <InfoListWrapper>
              {[
                { icon: User,   label: "Nama",   value: user?.name, valueColor: "default" as const },
                { icon: Mail,   label: "Email",  value: user?.email, valueColor: "default" as const },
                { icon: Shield, label: "Status", value: "Terverifikasi", valueColor: "emerald" as const },
              ].map(({ icon: Icon, label, value, valueColor }) => (
                <InfoItemBox key={label}>
                  <InfoIconBox>
                    <Icon size={14} className="text-obsidian-400" />
                  </InfoIconBox>
                  <div>
                    <InfoLabelText>{label}</InfoLabelText>
                    <InfoValueText color={valueColor}>{value}</InfoValueText>
                  </div>
                </InfoItemBox>
              ))}
            </InfoListWrapper>
          )}
        </AvatarCard>

        {/* Nav */}
        <NavCard>
          <NavLinkItem href="/orders">
            <NavIconBox>
              <ShoppingBag size={15} className="text-obsidian-400 group-hover:text-gold-400 transition-colors" />
            </NavIconBox>
            <NavContentBox>
              <NavTitle>Pesanan Saya</NavTitle>
              <NavDesc>Lihat riwayat dan status pesanan</NavDesc>
            </NavContentBox>
            <ChevronRight size={15} className="text-obsidian-600 group-hover:text-gold-500 transition-colors" />
          </NavLinkItem>
        </NavCard>

        {/* Logout */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full border border-red-900/60 bg-red-900/10 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-800">
          {logoutMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
          {logoutMutation.isPending ? "Keluar..." : "Keluar dari Akun"}
        </Button>
      </ContentWrapper>
    </PageContainer>
  )
}
