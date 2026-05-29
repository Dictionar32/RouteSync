export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown }

export interface ParserSchema<T> {
  parse?: (value: unknown) => T
  safeParse?: (value: unknown) => ParseResult<T>
}

export type SchemaLike<T> = ParserSchema<T> | ((value: unknown) => T)

export function parseWithSchema<T>(schema: SchemaLike<T> | undefined, value: unknown): T {
  if (!schema) return value as T

  if (typeof schema === 'function') {
    return schema(value)
  }

  if (schema.safeParse) {
    const result = schema.safeParse(value)
    if (result.success) return result.data
    throw result.error
  }

  if (schema.parse) {
    return schema.parse(value)
  }

  return value as T
}
