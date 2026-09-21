import { z } from 'zod'

export const ApiSchema = {
  RegisterCreate: z.object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
  }),
  LoginCreate: z.object({
    email: z.string(),
    password: z.string(),
  }),
  OauthCustom: z.object({
    redirectTo: z.string().nullable().optional(),
  }),
  SocialCreate: z.object({
    provider: z.string(),
    providerUserId: z.string(),
    email: z.string(),
    name: z.string().nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  }),
  ForgotPasswordCreate: z.object({
    email: z.string(),
  }),
  ResetPasswordCreate: z.object({
    email: z.string(),
    token: z.string(),
    password: z.string(),
  }),
  ProfileUpdate: z.object({
    name: z.string(),
    email: z.string(),
  }),
  CartCreate: z.object({
    produkItemId: z.string(),
    qty: z.number(),
    code: z.string(),
  }),
  CheckoutCreate: z.object({
    items: z.unknown().optional(),
    items.*.produkItemId: z.string().optional(),
    items.*.qty: z.number().optional(),
    shippingNama: z.string().nullable().optional(),
    shippingTelepon: z.string().nullable().optional(),
    shippingAlamat: z.string().nullable().optional(),
    shippingKota: z.string().nullable().optional(),
    shippingKodePos: z.string().nullable().optional(),
  }),
  BuyNowCreate: z.object({
    produkItemId: z.string(),
    qty: z.number(),
    shippingNama: z.string().nullable().optional(),
    shippingTelepon: z.string().nullable().optional(),
    shippingAlamat: z.string().nullable().optional(),
    shippingKota: z.string().nullable().optional(),
    shippingKodePos: z.string().nullable().optional(),
  }),
  WishlistCreate: z.object({
    produkItemId: z.string(),
  }),
  ProdukCreate: z.object({
    rating: z.number(),
    title: z.string().nullable().optional(),
    comment: z.string().nullable().optional(),
  }),
  PaymentCreate: z.object({
    metode: z.string(),
    detail: z.unknown().nullable().optional(),
    provider: z.string().nullable().optional(),
    providerTxnId: z.string().nullable().optional(),
    idempotencyKey: z.string().nullable().optional(),
    gatewayCode: z.string().nullable().optional(),
    gatewayMessage: z.string().nullable().optional(),
  }),
  AdminCreate: z.object({
    nama: z.string(),
    deskripsi: z.string().nullable().optional(),
    gambar: z.string().nullable().optional(),
    categoryId: z.string(),
    harga: z.number(),
    stok: z.number(),
    rating: z.number().nullable().optional(),
    jumlahReview: z.number().nullable().optional(),
  }),
}

export type ApiFormValues = {
  RegisterCreate: z.infer<typeof ApiSchema.RegisterCreate>
  LoginCreate: z.infer<typeof ApiSchema.LoginCreate>
  OauthCustom: z.infer<typeof ApiSchema.OauthCustom>
  SocialCreate: z.infer<typeof ApiSchema.SocialCreate>
  ForgotPasswordCreate: z.infer<typeof ApiSchema.ForgotPasswordCreate>
  ResetPasswordCreate: z.infer<typeof ApiSchema.ResetPasswordCreate>
  ProfileUpdate: z.infer<typeof ApiSchema.ProfileUpdate>
  CartCreate: z.infer<typeof ApiSchema.CartCreate>
  CheckoutCreate: z.infer<typeof ApiSchema.CheckoutCreate>
  BuyNowCreate: z.infer<typeof ApiSchema.BuyNowCreate>
  WishlistCreate: z.infer<typeof ApiSchema.WishlistCreate>
  ProdukCreate: z.infer<typeof ApiSchema.ProdukCreate>
  PaymentCreate: z.infer<typeof ApiSchema.PaymentCreate>
  AdminCreate: z.infer<typeof ApiSchema.AdminCreate>
}

export const ApiDefaultValues = {
  registerCreate: {} as ApiFormValues['RegisterCreate'],
  loginCreate: {} as ApiFormValues['LoginCreate'],
  oauthCustom: {} as ApiFormValues['OauthCustom'],
  socialCreate: {} as ApiFormValues['SocialCreate'],
  forgotPasswordCreate: {} as ApiFormValues['ForgotPasswordCreate'],
  resetPasswordCreate: {} as ApiFormValues['ResetPasswordCreate'],
  profileUpdate: {} as ApiFormValues['ProfileUpdate'],
  cartCreate: {} as ApiFormValues['CartCreate'],
  checkoutCreate: {} as ApiFormValues['CheckoutCreate'],
  buyNowCreate: {} as ApiFormValues['BuyNowCreate'],
  wishlistCreate: {} as ApiFormValues['WishlistCreate'],
  produkCreate: {} as ApiFormValues['ProdukCreate'],
  paymentCreate: {} as ApiFormValues['PaymentCreate'],
  adminCreate: {} as ApiFormValues['AdminCreate'],
}