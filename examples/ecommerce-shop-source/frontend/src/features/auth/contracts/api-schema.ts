import { z } from "zod"
import { commonSchemas } from "@/lib/core/validation"

// ================================
// SCHEMAS
// ================================
export const AuthApiSchema = {
  Login: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),

  Register: z
    .object({
      name: z.string().min(2, "Nama minimal 2 karakter"),
      email: commonSchemas.email,
      password: commonSchemas.password,
      passwordConfirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
    })
    .refine((d) => d.password === d.passwordConfirmation, {
      message: "Password tidak cocok",
      path: ["passwordConfirmation"],
    }),

  ForgotPassword: z.object({
    email: commonSchemas.email,
  }),

  ResetPassword: z
    .object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      passwordConfirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
    })
    .refine((d) => d.password === d.passwordConfirmation, {
      message: "Password tidak cocok",
      path: ["passwordConfirmation"],
    })
}

// ================================
// TYPES
// ================================
export type AuthFormValues = {
  Login: z.infer<typeof AuthApiSchema.Login>
  Register: z.infer<typeof AuthApiSchema.Register>
  ForgotPassword: z.infer<typeof AuthApiSchema.ForgotPassword>
  ResetPassword: z.infer<typeof AuthApiSchema.ResetPassword>
  SocialLogin: { provider: string; access_token: string }
}

// ================================
// DEFAULT VALUES
// ================================
export const AuthDefaultValues = {
  login: {
    email: "",
    password: "",
  } as AuthFormValues['Login'],

  register: {
    name: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  } as AuthFormValues['Register'],

  forgotPassword: {
    email: "",
  } as AuthFormValues['ForgotPassword'],

  resetPassword: {
    email: "",
    password: "",
    passwordConfirmation: "",
  } as AuthFormValues['ResetPassword']
}