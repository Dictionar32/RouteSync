/**
 * API Contract Zod schemas untuk validation
 * Generated dari TypeIR - pure type renderer
 * 
 * Berisi KEDUA arah sesuai Engine.Fix.md §16:
 * - Response schemas (output backend)
 * - Payload schemas (input ke backend)
 */

import { z } from 'zod'

// ==== RESPONSE SCHEMAS (Backend Output) ====
// Validates data coming FROM backend

export const RegisterResponseSchema = z.object({
  name: z.unknown(),
  email: z.unknown(),
  password: z.unknown(),
})

export type RegisterResponseResponse = z.infer<typeof RegisterResponseSchema>

export const validateRegisterResponseResponse = (payload: unknown): RegisterResponseResponse => 
  RegisterResponseSchema.parse(payload)

export const ProdukItemSchema = z.object({
  nama: z.unknown(),
  deskripsi: z.unknown(),
  gambar: z.unknown(),
  categoryId: z.unknown(),
  harga: z.unknown(),
  stok: z.unknown(),
  rating: z.unknown(),
  jumlahReview: z.unknown(),
})

export type ProdukItemResponse = z.infer<typeof ProdukItemSchema>

export const validateProdukItemResponse = (payload: unknown): ProdukItemResponse => 
  ProdukItemSchema.parse(payload)

export const OrderSchema = z.object({
  produkItemId: z.unknown(),
  qty: z.unknown(),
  code: z.unknown(),
  items: z.unknown(),
  itemsprodukItemId: z.unknown(),
  itemsqty: z.unknown(),
  shippingNama: z.unknown(),
  shippingTelepon: z.unknown(),
  shippingAlamat: z.unknown(),
  shippingKota: z.unknown(),
  shippingKodePos: z.unknown(),
})

export type OrderResponse = z.infer<typeof OrderSchema>

export const validateOrderResponse = (payload: unknown): OrderResponse => 
  OrderSchema.parse(payload)

export const PaymentSchema = z.object({
  metode: z.unknown(),
  detail: z.unknown(),
  provider: z.unknown(),
  providerTxnId: z.unknown(),
  idempotencyKey: z.unknown(),
  gatewayCode: z.unknown(),
  gatewayMessage: z.unknown(),
})

export type PaymentResponse = z.infer<typeof PaymentSchema>

export const validatePaymentResponse = (payload: unknown): PaymentResponse => 
  PaymentSchema.parse(payload)

// ==== COLLECTION RESPONSE SCHEMAS ====
export const RegisterResponsesResponseSchema = z.object({
  data: z.array(RegisterResponseSchema)
})

export const validateRegisterResponseCollectionResponse = (payload: unknown) =>
  RegisterResponsesResponseSchema.parse(payload)

export const ProdukItemsResponseSchema = z.object({
  data: z.array(ProdukItemSchema)
})

export const validateProdukItemCollectionResponse = (payload: unknown) =>
  ProdukItemsResponseSchema.parse(payload)

export const OrdersResponseSchema = z.object({
  data: z.array(OrderSchema)
})

export const validateOrderCollectionResponse = (payload: unknown) =>
  OrdersResponseSchema.parse(payload)

export const PaymentsResponseSchema = z.object({
  data: z.array(PaymentSchema)
})

export const validatePaymentCollectionResponse = (payload: unknown) =>
  PaymentsResponseSchema.parse(payload)

// ==== PAYLOAD SCHEMAS (Backend Input) ====
// Validates data going TO backend
