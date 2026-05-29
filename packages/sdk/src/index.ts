export { defineApi, createClient } from './defineApi'
export {
  createService,
  GenericService,
  type GenericServiceOptions,
  type Id,
  type QueryParams
} from './createService'
export { createClient as createHttpClient } from './createClient'
export { generateHooks } from './generateHooks'
export {
  snakeToCamelKey,
  camelToSnakeKey,
  mapKeysDeep,
  toCamelCase,
  toSnakeCase,
  type KeyCase,
  type UnknownRecord,
  type SnakeToCamel,
  type CamelToSnake,
  type CamelCasedPropertiesDeep,
  type SnakeCasedPropertiesDeep
} from './mappers/case'
export {
  parseWithSchema,
  type ParseResult,
  type ParserSchema,
  type SchemaLike
} from './mappers/schema'

// Re-export core types for convenience
export type {
  ServiceConfig,
  ApiResponse,
  HttpMethod,
  RouteDefinition,
  ApiDefinition
} from '@routesync/core'
