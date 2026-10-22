import type { RouteParserSchema } from '@routesync/core'

/**
 * Compatibility name for the canonical upstream parser contract.
 * A parser must expose both parse and safeParse; neither capability is optional.
 */
export type ParserSchema<T> = RouteParserSchema<T>

/** Function schemas are supported as an explicit transform/validation boundary. */
export type SchemaLike<T> = ParserSchema<T> | ((value: unknown) => T)

export type ParseResult<T> = ReturnType<RouteParserSchema<T>['safeParse']>

/**
 * Parse through a schema whose contract guarantees a runtime parser.
 * Missing schemas are handled by the caller as an explicit no-validation case;
 * they are not accepted here and never silently cast unknown input to T.
 */
export function parseWithSchema<T>(schema: SchemaLike<T>, value: unknown): T {
  if (typeof schema === 'function') {
    return schema(value)
  }

  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw result.error
}

/** Runtime guard for schema values arriving through an untyped route boundary. */
export function isSchemaLike(value: unknown): value is SchemaLike<unknown> {
  if (typeof value === 'function') return true
  if (typeof value !== 'object' || value === null) return false

  return typeof Reflect.get(value, 'parse') === 'function'
    && typeof Reflect.get(value, 'safeParse') === 'function'
}
