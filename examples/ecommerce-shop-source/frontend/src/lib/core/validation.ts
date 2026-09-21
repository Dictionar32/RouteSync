/**
 * Zod validation schemas and utilities
 */
import { z } from 'zod'

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  password: /^.{8,}$/,
} as const

/**
 * Common Zod schemas
 */
export const commonSchemas = {
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),

  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(patterns.phone, 'Invalid phone number format'),

  id: z
    .number()
    .positive('Invalid ID'),

  stringId: z
    .string()
    .min(1, 'ID is required'),

  page: z
    .number()
    .int()
    .positive()
    .default(1),

  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),

  search: z.string().optional(),

  sortBy: z.string().optional(),

  sortOrder: z.enum(['asc', 'desc']).optional(),
}

/**
 * Paginated query schema & type
 */
export const paginatedSchema = z.object({
  page: commonSchemas.page,
  per_page: commonSchemas.perPage,
})
export type PaginatedQuery = z.infer<typeof paginatedSchema>

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiPaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

/**
 * Helper: format Zod errors
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

/**
 * Helper: validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: formatZodErrors(result.error) }
}

/**
 * Helper: require non-empty string
 */
export const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`)
  }
  return value.trim()
}

/**
 * Helper: require valid positive integer ID
 */
export const requireValidId = (id: unknown): number => {
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}
