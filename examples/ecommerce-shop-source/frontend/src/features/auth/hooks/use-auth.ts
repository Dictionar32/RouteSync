import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { createAuthHooks } from "@/lib/generic/generic-auth-hooks"
import { QueryKey } from "@/lib/core/query-key"
import useAuthStore from "@/lib/stores/auth-store"
import { AuthService } from "../services/auth-service"
import { AuthFormValues } from "../contracts/api-schema"
import { AuthUser, AuthSession } from "../types/auth-read"

// ================================
// FACTORY HOOKS
// authFactory.useLogin(), authFactory.useLogout(), authFactory.useProfile()
// ================================
export const authFactory = createAuthHooks<
  AuthFormValues['Login'],
  AuthFormValues['Register'],
  AuthUser,
  AuthSession,
  AuthSession,
  void
>({
  service: {
    login: AuthService.login,
    register: AuthService.register,
    logout: AuthService.logout,
    profile: AuthService.me,
  },
})

// ================================
// EXTENDED HOOKS (+ router redirect + precise cache update)
// ================================

export const useLogin = () => {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (form: AuthFormValues['Login']) => AuthService.login(form),
    onSuccess: (session: AuthSession) => {
      // setQueryData langsung — tidak perlu refetch
      qc.setQueryData(QueryKey.auth.me(), session.user)
      qc.setQueryData(QueryKey.auth.profile(), session.user)
      router.push("/")
    },
  })
}

export const useRegister = () => {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (form: AuthFormValues['Register']) => AuthService.register(form),
    onSuccess: (session: AuthSession) => {
      qc.setQueryData(QueryKey.auth.me(), session.user)
      qc.setQueryData(QueryKey.auth.profile(), session.user)
      router.push("/")
    },
  })
}

export const useLogout = () => {
  const qc = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: AuthService.logout,
    onSuccess: () => {
      qc.clear() // hapus semua cache
      router.push("/login")
    },
  })
}

/**
 * Fetch user dari API.
 * initialData dari Zustand store — tidak ada loading flicker saat pertama render.
 */
export const useMe = () => {
  const storedUser = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: QueryKey.auth.me(),
    queryFn: AuthService.me,
    enabled: isAuthenticated,
    initialData: storedUser ? {
      ...storedUser,
      role: (storedUser as { role?: "user" | "admin" }).role ?? "user"
    } as AuthUser : undefined,
    staleTime: 5 * 60 * 1000,
  })
}

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (form: AuthFormValues['ForgotPassword']) => AuthService.forgotPassword(form),
  })

export const useResetPassword = () => {
  const router = useRouter()
  return useMutation({
    mutationFn: (form: AuthFormValues['ResetPassword']) => AuthService.resetPassword(form),
    onSuccess: () => router.push("/login"),
  })
}

export const useSocialLogin = () => {
  const qc = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (form: AuthFormValues['SocialLogin']) => AuthService.socialLogin(form),
    onSuccess: (session: AuthSession) => {
      qc.setQueryData(QueryKey.auth.me(), session.user)
      router.push("/")
    },
  })
}

// ================================
// SELECTOR HOOKS — Zustand, zero network call, zero re-render overhead
// ================================
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
export const useCurrentUser = () => useAuthStore((s) => s.user)
