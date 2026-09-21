import { z } from "zod"

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  no_telp: z.string().nullable().optional(),
  alamat: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]).default("user"),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const SessionSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    token: z.string(),
    user: UserSchema,
  })
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const RegisterSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  password_confirmation: z.string(),
})

// Types
export type AuthUserResponse = z.infer<typeof UserSchema>
export type AuthSessionResponse = z.infer<typeof SessionSchema>
export type AuthApiLogin = z.infer<typeof LoginSchema>
export type AuthApiRegister = z.infer<typeof RegisterSchema>
export type AuthApiForgotPassword = { email: string }
export type AuthApiResetPassword = { email: string; password: string; password_confirmation: string }
export type AuthApiSocialLogin = { provider: string; access_token: string }

// Validators
export const validateUser = (payload: unknown): AuthUserResponse =>
  UserSchema.parse(payload)

export const validateSession = (payload: unknown): AuthSessionResponse =>
  SessionSchema.parse(payload)