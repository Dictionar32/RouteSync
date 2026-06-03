export { defineApi, createClient, type EndpointCallable, type CallOptions, type EndpointCallableOptions, type LooseEndpointOptions, type OptionalIfEmpty, type ApiError } from './defineApi'
export { endpoint, type EndpointDefinition } from './endpoint'
export {
  resource,
  type ResourceConfig,
  type ResourceDefinition,
} from './resource'
export {
  createService,
  GenericService,
  type GenericServiceOptions,
  type Id,
  type QueryParams,
} from './createService'
export { SdkGenerator, ReactQueryEmitter, ZodEmitter } from './generator'
export { TSPrinter } from './emitter/TSPrinter'
export { ZodToTSEmitIR } from './emitter/ZodToTSEmitIR'
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
  type SnakeCasedPropertiesDeep,
} from './mappers/case'
export {
  parseWithSchema,
  type ParseResult,
  type ParserSchema,
  type SchemaLike,
} from './mappers/schema'

// Re-export core types
export type {
  ServiceConfig,
  ApiResponse,
  HttpMethod,
  RouteMapper,
  RouteSchema,
  RouteSchemaMap,
  RouteSchemaValue,
  RouteParserSchema,
  RouteTransform,
  RouteTransformMap,
  RouteDefinition,
  ApiDefinition
} from '@routesync/core'
