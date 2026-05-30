import { HttpClient } from '@routesync/core'
import { PathResolver } from '@routesync/core'
import { ApiDefinition, RouteDefinition } from '@routesync/core'
import { ServiceConfig } from '@routesync/core'
import { SchemaLike, parseWithSchema } from './mappers/schema'

// ----------------------------------------------------------------
// Call options
// ----------------------------------------------------------------
export type CallOptions = {
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  headers?: Record<string, string>
}

// ----------------------------------------------------------------
// EndpointCallable — a callable function that also carries metadata
// so hooks can read method, path, queryKey without extra arguments.
//
//   api.cart.list({ query: { page: 1 } })   ← call
//   api.cart.list.$def                       ← RouteDefinition
//   api.cart.list.$key                       ← ['cart', 'list']
// ----------------------------------------------------------------
export interface EndpointCallable {
  (options?: CallOptions): Promise<any>
  /** Original RouteDefinition — used by useApiQuery / useApiMutation */
  $def: RouteDefinition
  /** Stable TanStack query key: [group, action] */
  $key: string[]
}

type ApiGroupProxy<G extends Record<string, RouteDefinition>> = {
  [K in keyof G]: EndpointCallable
}

type ApiProxy<T extends ApiDefinition> = {
  [G in keyof T]: ApiGroupProxy<T[G]>
}

// ----------------------------------------------------------------
// Singleton HTTP client
// ----------------------------------------------------------------
let _client: HttpClient | null = null

function getClient(): HttpClient {
  if (!_client) {
    throw new Error('RouteSync not initialized. Call createClient() first.')
  }
  return _client
}

export function createClient(config: ServiceConfig) {
  _client = new HttpClient(config)
  return _client
}

// ----------------------------------------------------------------
// defineApi
// ----------------------------------------------------------------
export function defineApi<T extends ApiDefinition>(
  definition: T,
  config?: ServiceConfig
): ApiProxy<T> {
  if (config) {
    createClient(config)
  }

  const proxy = {} as ApiProxy<T>

  for (const group in definition) {
    const groupDef = definition[group]
    const groupProxy = {} as ApiGroupProxy<typeof groupDef>

    for (const action in groupDef) {
      const route = groupDef[action]

      const callable = async (options?: CallOptions) => {
        const client = getClient()

        const params = applyMapper(
          route, 'params',
          parseRouteSchema(route, 'params', options?.params)
        ) as Record<string, any> | undefined

        const query = applyMapper(
          route, 'query',
          parseRouteSchema(route, 'query', options?.query)
        ) as Record<string, any> | undefined

        const body = applyMapper(
          route, 'body',
          parseRouteSchema(route, 'body', options?.body)
        )

        const resolvedPath = PathResolver.resolve(route.path, params)

        const method = route.method.toLowerCase() as
          | 'get' | 'post' | 'put' | 'patch' | 'delete'

        const requestConfig = { params: query, headers: { ...route.headers, ...options?.headers } }

        let response: unknown

        if (method === 'get' || method === 'delete') {
          response = await client[method](resolvedPath, requestConfig)
        } else {
          response = await client[method](resolvedPath, body, requestConfig)
        }

        return applyMapper(
          route, 'response',
          parseRouteSchema(route, 'response', response)
        )
      }

      // Attach metadata to the callable
      ;(callable as EndpointCallable).$def = route
      ;(callable as EndpointCallable).$key = [group, action]

      groupProxy[action] = callable as EndpointCallable
    }

    ;(proxy as any)[group] = groupProxy
  }

  return proxy
}

// ----------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------
type RouteSchemaPart = 'params' | 'query' | 'body' | 'response'

const routeSchemaKeys = ['params', 'query', 'body', 'request', 'response']

function parseRouteSchema(
  route: RouteDefinition,
  part: RouteSchemaPart,
  value: unknown
): unknown {
  if (value === undefined) return undefined
  const schema = pickRouteSchema(route, part)
  return parseWithSchema(schema as SchemaLike<unknown> | undefined, value)
}

function pickRouteSchema(route: RouteDefinition, part: RouteSchemaPart): unknown {
  const schema = route.schema
  if (!schema) return undefined

  if (hasRouteSchemaKeys(schema)) {
    return schema[part] ?? (part === 'body' ? schema.request : undefined)
  }

  return defaultSchemaPart(route.method) === part ? schema : undefined
}

function hasRouteSchemaKeys(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      routeSchemaKeys.some((key) => key in value)
  )
}

function defaultSchemaPart(method: RouteDefinition['method']): RouteSchemaPart {
  return method === 'GET' || method === 'DELETE' ? 'response' : 'body'
}

function applyMapper(
  route: RouteDefinition,
  part: RouteSchemaPart,
  value: unknown
): unknown {
  if (value === undefined || !route.mapper) return value

  if (typeof route.mapper === 'function') {
    return part === 'response' ? route.mapper(value) : value
  }

  const mapper =
    route.mapper[part] ?? (part === 'body' ? route.mapper.request : undefined)

  return mapper ? mapper(value) : value
}
