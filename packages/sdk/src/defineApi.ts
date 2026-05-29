import { HttpClient } from '@routesync/core'
import { PathResolver } from '@routesync/core'
import { ApiDefinition, RouteDefinition } from '@routesync/core'
import { ServiceConfig } from '@routesync/core'

type CallOptions<R extends RouteDefinition> = {
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
}

type ApiGroupProxy<G extends Record<string, RouteDefinition>> = {
  [K in keyof G]: (options?: CallOptions<G[K]>) => Promise<any>
}

type ApiProxy<T extends ApiDefinition> = {
  [G in keyof T]: ApiGroupProxy<T[G]>
}

let _client: HttpClient | null = null

function getClient(): HttpClient {
  if (!_client) {
    throw new Error(
      'RouteSync not initialized. Call createClient() first.'
    )
  }
  return _client
}

export function createClient(config: ServiceConfig) {
  _client = new HttpClient(config)
  return _client
}

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

      groupProxy[action] = async (options?: CallOptions<typeof route>) => {
        const client = getClient()

        // Resolve path params
        const resolvedPath = PathResolver.resolve(
          route.path,
          options?.params
        )

        const method = route.method.toLowerCase() as
          | 'get'
          | 'post'
          | 'put'
          | 'patch'
          | 'delete'

        if (method === 'get' || method === 'delete') {
          return client[method](resolvedPath, {
            params: options?.query
          })
        }

        return client[method](resolvedPath, options?.body)
      }
    }

    ;(proxy as any)[group] = groupProxy
  }

  return proxy
}
