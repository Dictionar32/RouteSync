import { RouteDefinition } from '@routesync/core'

export type EndpointDefinition = RouteDefinition

export interface ResourceConfig<
  TEndpoints extends Record<string, EndpointDefinition>
> {
  /**
   * Optional base path for grouping / documentation purposes only.
   * NOT merged into endpoint paths — each endpoint fully owns its own path.
   * @deprecated Use endpoint.path directly. This field is ignored at runtime.
   */
  basePath?: string

  endpoints: TEndpoints

  /** Default auth flag applied to all endpoints that don't override it. */
  auth?: boolean

  /** Default headers merged with per-endpoint headers (endpoint takes priority). */
  headers?: Record<string, string>

  /** Default cache config applied to endpoints that don't override it. */
  cache?: unknown

  /** Default retry config applied to endpoints that don't override it. */
  retry?: unknown
}

export type ResourceDefinition<
  TEndpoints extends Record<string, EndpointDefinition>
> = {
  [K in keyof TEndpoints]: RouteDefinition
}

/**
 * resource() — group related endpoints together.
 *
 * Each endpoint fully owns its path. No path merging happens.
 * Defaults (auth, headers, cache, retry) cascade down but endpoints can override.
 *
 * Usage:
 *   const cartResource = resource({
 *     auth: true,
 *     endpoints: {
 *       list:   { method: 'GET',    path: '/cart/items' },
 *       show:   { method: 'GET',    path: '/cart/items/:id' },
 *       create: { method: 'POST',   path: '/cart/items' },
 *       update: { method: 'PATCH',  path: '/cart/items/:id' },
 *       delete: { method: 'DELETE', path: '/cart/items/:id' },
 *     },
 *   })
 */
export function resource<
  TEndpoints extends Record<string, EndpointDefinition>
>(config: ResourceConfig<TEndpoints>): ResourceDefinition<TEndpoints> {
  const result = {} as ResourceDefinition<TEndpoints>

  for (const key in config.endpoints) {
    const ep = config.endpoints[key]

    result[key] = {
      ...ep,
      // Endpoint-level overrides cascade defaults, never the other way around
      auth: ep.auth ?? config.auth,
      headers: {
        ...(config.headers ?? {}),
        ...(ep.headers ?? {}),
      },
      cache: ep.cache ?? config.cache,
      retry: ep.retry ?? config.retry,
    }
  }

  return result
}