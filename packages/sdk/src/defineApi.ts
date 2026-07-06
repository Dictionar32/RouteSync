import { HttpClient } from '@routesync/core'
import { PathResolver } from '@routesync/core'
import { ApiDefinition, RouteDefinition, HttpMethod } from '@routesync/core'
import { ServiceConfig } from '@routesync/core'
import { SchemaLike, parseWithSchema } from './mappers/schema'

// ----------------------------------------------------------------
// Call options
// ----------------------------------------------------------------
export type CallOptions<TParams = unknown, TBody = unknown> = {
  params?: TParams
  query?: Record<string, unknown>
  body?: TBody
  headers?: Record<string, string>
}

// ----------------------------------------------------------------
// EndpointCallable — a callable function that also carries metadata
// so hooks can read method, path, queryKey without extra arguments.
//
//   api.cart.list({ query: { page: 1 } })   ← call
export type EndpointCallableOptions<TParams, TBody> = 
  (
    (
      (unknown extends TParams ? { params?: never } : { params: TParams }) & 
      (unknown extends TBody ? { body?: TBody } : { body: TBody })
    ) | (
      (unknown extends TParams ? {} : TParams) &
      (unknown extends TBody ? {} : TBody)
    )
  ) & { query?: Record<string, unknown>; headers?: Record<string, string> }

// Loose shape for generated hooks — superset of EndpointCallableOptions<unknown, unknown>
export type LooseEndpointOptions = {
  params?: unknown
  query?: Record<string, unknown>
  body?: unknown
  headers?: Record<string, string>
}

// Extract only the required keys from T
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

// Make the options argument optional if there are no required keys (excluding query/headers)
export type OptionalIfEmpty<T> = RequiredKeys<Omit<T, 'query' | 'headers'>> extends never
  ? [options?: T]
  : [options: T]

export interface ApiError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

export interface EndpointCallable<TResponse = unknown, TParams = unknown, TBody = unknown, TMethod extends HttpMethod = HttpMethod> {
  (...args: OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>): Promise<TResponse>
  // Overload for generated hooks — options may be undefined or loosely typed
  (options: LooseEndpointOptions | undefined): Promise<TResponse>
  // Overload that accepts plain CallOptions — used by useApiInfiniteQuery
  (options: CallOptions<TParams, TBody>): Promise<TResponse>
  /** Original RouteDefinition — used by useApiQuery / useApiMutation */
  $def: RouteDefinition<TResponse, TParams, TBody, TMethod>
  /** Stable TanStack query key: [group, action] */
  $key: string[]
  /** Consistent query key builder that incorporates params/query if provided */
  $queryKey: (options?: EndpointCallableOptions<TParams, TBody>) => unknown[]
}

type ApiGroupProxy<G extends Record<string, RouteDefinition<unknown, unknown, unknown, HttpMethod>>> = {
  [K in keyof G]: EndpointCallable<
    G[K] extends RouteDefinition<infer R, unknown, unknown, HttpMethod> ? R : unknown,
    G[K] extends RouteDefinition<unknown, infer P, unknown, HttpMethod> ? P : unknown,
    G[K] extends RouteDefinition<unknown, unknown, infer B, HttpMethod> ? B : unknown,
    G[K] extends RouteDefinition<unknown, unknown, unknown, infer M> ? (M extends HttpMethod ? M : HttpMethod) : HttpMethod
  >
}

type ApiProxy<T extends ApiDefinition> = {
  [G in keyof T]: ApiGroupProxy<T[G]>
}

// ----------------------------------------------------------------
// Singleton HTTP client
// ----------------------------------------------------------------
let _client: HttpClient | null = null

export function getClient(): HttpClient {
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

      const callable = async (options?: unknown) => {
        const client = getClient()

        const resolvedOptions = splitFlatOptions(route, options) as CallOptions | undefined

        const params = applyMapper(
          route, 'params',
          parseRouteSchema(route, 'params', resolvedOptions?.params)
        ) as Record<string, unknown> | undefined

        const query = applyMapper(
          route, 'query',
          parseRouteSchema(route, 'query', resolvedOptions?.query)
        ) as Record<string, unknown> | undefined

        let body = applyMapper(
          route, 'body',
          parseRouteSchema(route, 'body', resolvedOptions?.body)
        )
        if (route.contract?.body && body !== undefined) {
          body = route.contract.body(body)
        }

        const resolvedPath = PathResolver.resolve(route.path, params)

        const method = route.method.toLowerCase() as
          | 'get' | 'post' | 'put' | 'patch' | 'delete'

        const requestConfig = { params: query, headers: { ...route.headers, ...resolvedOptions?.headers } }

        let response: unknown

        if (method === 'get' || method === 'delete') {
          response = await client[method](resolvedPath, requestConfig)
        } else {
          response = await client[method](resolvedPath, body, requestConfig)
        }

        const responseSchema = route.contract?.response ?? route.responseSchema
        if (client.config.validateResponse && responseSchema) {
          try {
            if (typeof responseSchema === 'function') {
              response = (responseSchema as (val: unknown) => unknown)(response)
            } else {
              response = responseSchema.parse(response)
            }
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
          response = parseRouteSchema(route, 'response', response)
        }

        return applyMapper(
          route, 'response',
          response
        )
      }

      // Attach metadata to the callable
      const callableObj = callable as unknown as Record<string, unknown>
      callableObj.$def = route
      callableObj.$key = [group, action]
      callableObj.$queryKey = (options?: EndpointCallableOptions<unknown, unknown>) => {
        return options ? [group, action, options] : [group, action]
      }

      const groupProxyObj = groupProxy as unknown as Record<string, unknown>
      groupProxyObj[action] = callable
    }

    const proxyObj = proxy as unknown as Record<string, unknown>
    proxyObj[group] = groupProxy
  }

  return proxy
}

function splitFlatOptions(route: RouteDefinition<unknown, unknown, unknown, HttpMethod>, variables: unknown): unknown {
  if (!variables || typeof variables !== 'object') {
    return variables
  }

  const varObj = variables as Record<string, unknown>

  // If variables is already formatted with params/body/query options, return it as is
  if ('params' in varObj || 'body' in varObj || 'query' in varObj) {
    return variables
  }

  const paramKeys = PathResolver.extractParams(route.path)
  const method = route.method ?? 'POST'

  if (paramKeys.length === 0) {
    if (method === 'GET') {
      return { query: variables }
    }
    return { body: variables }
  }

  const params: Record<string, unknown> = {}
  const rest: Record<string, unknown> = {}

  for (const key of Object.keys(varObj)) {
    if (paramKeys.includes(key)) {
      params[key] = varObj[key]
    } else {
      rest[key] = varObj[key]
    }
  }

  if (method === 'GET') {
    return { params, query: rest }
  }
  return { params, body: rest }
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