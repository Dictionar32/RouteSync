import { HttpClient } from '@routesync/core'
import { PathResolver } from '@routesync/core'
import { ApiDefinition, RouteDefinition } from '@routesync/core'
import { ServiceConfig } from '@routesync/core'
import { SchemaLike, parseWithSchema } from './mappers/schema'

// ----------------------------------------------------------------
// Call options
// ----------------------------------------------------------------
export type CallOptions<TParams = unknown, TBody = unknown> = {
  params?: TParams
  query?: Record<string, any>
  body?: TBody
  headers?: Record<string, string>
}

// ----------------------------------------------------------------
// EndpointCallable — a callable function that also carries metadata
// so hooks can read method, path, queryKey without extra arguments.
//
//   api.cart.list({ query: { page: 1 } })   ← call
export type EndpointCallableOptions<TParams, TBody> = 
  (unknown extends TParams ? {} : { params: TParams }) & 
  (unknown extends TBody ? { body?: unknown } : { body: TBody }) & 
  { query?: Record<string, any>; headers?: Record<string, string> }

// A helper to make the options argument optional if all required keys are missing or optional
export type OptionalIfEmpty<T> = keyof Omit<T, 'query' | 'headers'> extends never ? [options?: T] : [options: T]

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export interface EndpointCallable<TResponse = unknown, TParams = unknown, TBody = unknown> {
  (...args: OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>): Promise<TResponse>
  /** Original RouteDefinition — used by useApiQuery / useApiMutation */
  $def: RouteDefinition<TResponse, TParams, TBody>
  /** Stable TanStack query key: [group, action] */
  $key: string[]
  /** Consistent query key builder that incorporates params/query if provided */
  $queryKey: (...args: OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>) => unknown[]
}

type ApiGroupProxy<G extends Record<string, RouteDefinition<any, any, any>>> = {
  [K in keyof G]: EndpointCallable<
    G[K] extends RouteDefinition<infer R, any, any> ? R : unknown,
    G[K] extends RouteDefinition<any, infer P, any> ? P : unknown,
    G[K] extends RouteDefinition<any, any, infer B> ? B : unknown
  >
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

        if (client.config.validateResponse && route.responseSchema) {
          try {
            response = route.responseSchema.parse(response)
          } catch (error) {
            if (client.config.onValidationError) {
              client.config.onValidationError(error, {
                endpoint: action,
                method: route.method,
                path: resolvedPath,
                request: { params, query, body, headers: requestConfig.headers },
                response
              })
            }
            throw error
          }
        } else if (client.config.validateResponse) {
          // If no response schema, fallback to route.schema.response if it exists
          response = parseRouteSchema(route, 'response', response)
        }

        return applyMapper(
          route, 'response',
          response
        )
      }

      // Attach metadata to the callable
      ;(callable as any).$def = route
      ;(callable as any).$key = [group, action]
      ;(callable as any).$queryKey = (options?: any) => {
        return options ? [group, action, options] : [group, action]
      }

      groupProxy[action] = callable as any
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
