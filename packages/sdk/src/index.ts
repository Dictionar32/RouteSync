export { defineApi, createClient } from './defineApi'
export { createService, GenericService } from './createService'
export { createClient as createHttpClient } from './createClient'
export { generateHooks } from './generateHooks'

// Re-export core types for convenience
export type {
  ServiceConfig,
  ApiResponse,
  HttpMethod,
  RouteDefinition,
  ApiDefinition
} from '@routesync/core'
