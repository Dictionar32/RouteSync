import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.number().int().positive(),
  nama: z.string().min(1, 'Nama kategori is required'),
})

export const IndexSchema = z.array(CategorySchema)

export const CreateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori is required'),
})

export const UpdateSchema = z.object({
  nama: z.string().min(1, 'Nama kategori is required').optional(),
})

export const CategoryListSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
  search: z.string().optional(),
})

export type CategoryApiResponse = z.infer<typeof CategorySchema>
export type CategoryApiIndex = z.infer<typeof IndexSchema>
export type CategoryApiCreate = z.infer<typeof CreateSchema>
export type CategoryApiUpdate = z.infer<typeof UpdateSchema>
export type CategoryApiListSchema = z.infer<typeof CategoryListSchema>

export const validateSchema = (payload: unknown): CategoryApiResponse => CategorySchema.parse(payload)
export const validateIndex = (payload: unknown): CategoryApiIndex => IndexSchema.parse(payload)
export const validateCreate = (payload: unknown): CategoryApiCreate => CreateSchema.parse(payload)
export const validateUpdate = (payload: unknown): CategoryApiUpdate => UpdateSchema.parse(payload)
export const validateList = (payload: unknown): CategoryApiListSchema => CategoryListSchema.parse(payload)