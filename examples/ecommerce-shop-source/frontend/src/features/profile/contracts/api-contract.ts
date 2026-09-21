/**
 * Profile API Contract - Zod schemas with types
 */
import { z } from 'zod'

export const Schema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Email tidak valid'),
});

export const IndexSchema = z.array(Schema);

export const UpdateSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi').optional(),
  email: z.string().email('Email tidak valid').optional(),
});

export type ProfileApiResponse = z.infer<typeof Schema>
export type ProfileApiIndex = z.infer<typeof IndexSchema>
export type ProfileApiUpdate = z.infer<typeof UpdateSchema>

export const ValidateSchema = (payload: unknown): ProfileApiResponse => Schema.parse(payload)
export const ValidateUpdate = (payload: unknown): ProfileApiUpdate => UpdateSchema.parse(payload)
export const validateIndex = (payload: unknown): ProfileApiIndex => IndexSchema.parse(payload)