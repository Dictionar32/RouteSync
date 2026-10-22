/**
 * Canonical upstream contract for runtime schema parsing.
 *
 * A parser contract exposes both throwing and result-based parsing. Requiring
 * both operations prevents downstream consumers from treating an object with
 * neither operation as a valid schema and silently passing unknown data through.
 */
export type SafeParseResult<T = unknown> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: unknown }

export interface RouteParserSchema<T = unknown> {
  readonly parse: (input: unknown) => T
  readonly safeParse: (input: unknown) => SafeParseResult<T>
}
