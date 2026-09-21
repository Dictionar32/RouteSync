import { Http } from "@/lib/core/api-client"
import { API_ENDPOINTS } from "@/lib/core/constants"
import useAuthStore from "@/lib/stores/auth-store"
import {
  toApiLogin,
  toSessionRead,
  toApiRegister,
  toUserRead,
  toApiForgotPassword,
  toApiResetPassword,
  toApiSocialLogin
} from "../mappers/auth-mapper"
import { validateSession, validateUser } from "../contracts/api-contract"
import { AuthUser, AuthSession } from "../types/auth-read"
import { AuthFormValues } from "../contracts/api-schema"

interface ApiWrapper<T> { success: boolean; message: string; data: T }

export const AuthService = {

  async login(form: AuthFormValues['Login']): Promise<AuthSession> {
    const res = await Http.post<ApiWrapper<unknown>>(
      API_ENDPOINTS.LOGIN,
      toApiLogin(form)
    )
    const session = toSessionRead(validateSession(res))
    useAuthStore.getState().setAuth(session.user, session.token)
    return session
  },

  async register(form: AuthFormValues['Register']): Promise<AuthSession> {
    const res = await Http.post<ApiWrapper<unknown>>(
      API_ENDPOINTS.REGISTER,
      toApiRegister(form)
    )
    const session = toSessionRead(validateSession(res))
    useAuthStore.getState().setAuth(session.user, session.token)
    return session
  },

  async logout(): Promise<void> {
    try {
      await Http.post<ApiWrapper<unknown>>(API_ENDPOINTS.LOGOUT)
    } finally {
      useAuthStore.getState().logout()
    }
  },

  async me(): Promise<AuthUser> {
    const res = await Http.get<ApiWrapper<unknown>>(API_ENDPOINTS.ME)
    const user = toUserRead(validateUser(res.data))
    useAuthStore.getState().updateUser(user)
    return user
  },

  async forgotPassword(form: AuthFormValues['ForgotPassword']): Promise<string> {
    const res = await Http.post<ApiWrapper<unknown>>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      toApiForgotPassword(form)
    )
    return res.message ?? "Email reset password telah dikirim"
  },

  async resetPassword(form: AuthFormValues['ResetPassword']): Promise<string> {
    const res = await Http.post<ApiWrapper<unknown>>(
      API_ENDPOINTS.RESET_PASSWORD,
      toApiResetPassword(form)
    )
    return res.message ?? "Password berhasil direset"
  },

  async socialLogin(form: AuthFormValues['SocialLogin']): Promise<AuthSession> {
    const res = await Http.post<ApiWrapper<unknown>>(
      API_ENDPOINTS.SOCIAL_LOGIN,
      toApiSocialLogin(form)
    )
    const session = toSessionRead(validateSession(res))
    useAuthStore.getState().setAuth(session.user, session.token)
    return session
  },

  getOAuthRedirectUrl(provider: string): string {
    const base = process.env.NEXT_PUBLIC_API_URL
    if (!base) throw new Error("NEXT_PUBLIC_API_URL is not defined")
    return `${base}/oauth/${provider}/redirect`
  },
}