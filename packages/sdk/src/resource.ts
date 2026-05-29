import { RouteDefinition } from '@routesync/core'

export type ResourceEndpointDefinition = Omit<RouteDefinition, 'path'> & {
  path?: string
}

export interface ResourceConfig<
  TEndpoints extends Record<string, ResourceEndpointDefinition>
> {
  path: string
  endpoints: TEndpoints
  contract?: unknown
  schema?: RouteDefinition['schema']
  mapper?: RouteDefinition['mapper']
  auth?: boolean
  headers?: Record<string, string>
  cache?: unknown
  retry?: unknown
}

export type ResourceDefinition<
  TEndpoints extends Record<string, ResourceEndpointDefinition>
> = {
  [K in keyof TEndpoints]: RouteDefinition
}

export function resource<
  TEndpoints extends Record<string, ResourceEndpointDefinition>
>(config: ResourceConfig<TEndpoints>): ResourceDefinition<TEndpoints> {
  const endpoints = {} as ResourceDefinition<TEndpoints>

  for (const key in config.endpoints) {
    const endpoint = config.endpoints[key]

    endpoints[key] = {
      ...endpoint,
      path: joinPaths(config.path, endpoint.path),
      auth: endpoint.auth ?? config.auth,
      headers: {
        ...(config.headers ?? {}),
        ...(endpoint.headers ?? {})
      },
      schema: endpoint.schema ?? config.schema,
      mapper: endpoint.mapper ?? config.mapper,
      cache: endpoint.cache ?? config.cache,
      retry: endpoint.retry ?? config.retry
    }
  }

  return endpoints
}

function joinPaths(basePath: string, childPath = ''): string {
  const base = normalizeBasePath(basePath)
  const child = normalizeChildPath(childPath)

  if (!child) return base
  if (!base) return `/${child}`

  return `${base}/${child}`
}

function normalizeBasePath(path: string): string {
  if (!path || path === '/') return ''
  return `/${path.replace(/^\/+|\/+$/g, '')}`
}

function normalizeChildPath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}
