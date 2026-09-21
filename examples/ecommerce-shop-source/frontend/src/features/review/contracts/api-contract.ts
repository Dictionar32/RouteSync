import z from "zod";

export const Schema = z.object({
  id: z.number(),
  rating: z.number(),
  title: z.string().nullable(),
  comment: z.string(),
  is_verified_purchase: z.boolean(),
  created_at: z.string(),
});

export const IndexSchema = z.array(Schema);

export const CreateSchema = z.object({ 
  rating: z.number().min(1).max(5, 'Rating harus antara 1 dan 5'),
  title: z.string().min(1, 'Title harus diisi').optional(),
  comment: z.string().min(1, 'Comment harus diisi'),
});

export type ReviewApiResponse = z.infer<typeof Schema>
export type ReviewApiIndex = z.infer<typeof IndexSchema>
export type ReviewApiCreate = z.infer<typeof CreateSchema>

export const validateSchema = (payload: unknown): ReviewApiResponse => Schema.parse(payload)
export const validateIndex = (payload: unknown): ReviewApiIndex => IndexSchema.parse(payload)
export const validateCreate = (payload: unknown): ReviewApiCreate => CreateSchema.parse(payload)