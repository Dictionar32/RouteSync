// Client
export { HttpClient } from './client/HttpClient'
export { Request } from './client/Request'
export { Response } from './client/Response'
export { Interceptor } from './client/Interceptor'

// Auth
export { TokenManager } from './auth/TokenManager'
export { AuthMiddleware } from './auth/AuthMiddleware'

// Routing
export { PathResolver } from './routing/PathResolver'
export { QueryBuilder } from './routing/QueryBuilder'

// Errors
export { ApiError } from './errors/ApiError'
export { ErrorHandler } from './errors/ErrorHandler'

// Types
export type { ServiceConfig, RetryConfig, AuthConfig } from './types/config'
export type { ApiResponse, PaginationMeta } from './types/response'
export type {
  HttpMethod,
  RequestOptions,
  RouteDefinition,
  ApiDefinition,
  RouteMapper,
  RouteSchema,
  RouteSchemaMap,
  RouteSchemaValue,
  RouteParserSchema,
  RouteTransform,
  RouteTransformMap
} from './types/request'
export type { RouteManifest, ParsedRoute, ParsedChannel, ParsedModel, ParsedColumn } from './types/route'
