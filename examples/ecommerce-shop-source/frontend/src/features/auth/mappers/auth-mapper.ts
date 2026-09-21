import type { AuthUser, AuthSession } from "../types/auth-read"
import { AuthFormValues } from "../contracts/api-schema"
import type {
  AuthUserResponse,
  AuthSessionResponse,
  AuthApiLogin,
  AuthApiRegister,
  AuthApiForgotPassword,
  AuthApiResetPassword,
  AuthApiSocialLogin
} from "../contracts/api-contract"
import { AuthApiField } from "../contracts/api-field"

export const toUserRead = (api: AuthUserResponse): AuthUser => ({
  id: api.id,
  name: api.name,
  email: api.email,
  noTelepon: api.no_telp ?? undefined,   // snake_case sesuai useAuthStore User type
  alamat: api.alamat ?? undefined,
  avatar: api.avatar ?? undefined,
  role: api.role,
})

export const toSessionRead = (api: AuthSessionResponse): AuthSession => ({
  success: api.success,
  message: api.message,
  token: api.data.token,
  user: toUserRead(api.data.user)
})

export const toApiLogin = (form: AuthFormValues['Login']): AuthApiLogin => ({
  [AuthApiField.EMAIL]: form.email,
  [AuthApiField.PASSWORD]: form.password,
})

export const toApiRegister = (form: AuthFormValues['Register']): AuthApiRegister => ({
  [AuthApiField.NAME]: form.name,
  [AuthApiField.EMAIL]: form.email,
  [AuthApiField.PASSWORD]: form.password,
  [AuthApiField.PASSWORD_CONFIRMATION]: form.passwordConfirmation,
})

export const toApiForgotPassword = (form: AuthFormValues['ForgotPassword']): AuthApiForgotPassword => ({
  [AuthApiField.EMAIL]: form.email,
})

export const toApiResetPassword = (form: AuthFormValues['ResetPassword']): AuthApiResetPassword => ({
  [AuthApiField.EMAIL]: form.email,
  [AuthApiField.PASSWORD]: form.password,
  [AuthApiField.PASSWORD_CONFIRMATION]: form.passwordConfirmation,
})

export const toApiSocialLogin = (form: AuthFormValues['SocialLogin']): AuthApiSocialLogin => ({
  [AuthApiField.PROVIDER]: form.provider,
  [AuthApiField.ACCESS_TOKEN]: form.access_token,
})