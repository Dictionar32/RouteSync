import { type EndpointCallable, type EndpointCallableOptions, type OptionalIfEmpty, type ApiError, type RouteDefinition } from '@routesync/sdk'
import { useApiQuery, type ApiQueryOptions } from './useQuery'
import { useApiMutation, type ApiMutationOptions } from './useMutation'

/**
 * createHooks — generate typed hooks from an api group.
 *
 * Usage:
 *   const cartHooks = createHooks(api.cart)
 *   const { useList, useAddItem } = cartHooks
 *
 *   // In component:
 *   const { data } = useList()
 *   const mutation = useAddItem()
 */
function isEndpointCallable(value: unknown): value is EndpointCallable {
  if (typeof value !== 'function') return false

  const definition: unknown = Reflect.get(value, '$def')
  const key: unknown = Reflect.get(value, '$key')
  const queryKey: unknown = Reflect.get(value, '$queryKey')
  if (typeof definition !== 'object' || definition === null) return false
  if (!Array.isArray(key) || typeof queryKey !== 'function') return false

  const hookKind: unknown = Reflect.get(definition, 'hookKind')
  return hookKind === 'query' || hookKind === 'infinite_query' || hookKind === 'mutation'
}

export function createHooks<T extends Record<string, unknown>>(
  group: T
) {
  const hooks: Record<string, (...args: never) => unknown> = {}

  for (const [action, endpoint] of Object.entries(group)) {
    if (!isEndpointCallable(endpoint)) {
      throw new Error(`RouteSync endpoint ${action} is missing a valid SDK endpoint contract`)
    }
    const hookKind = endpoint.$def.hookKind
    const hookName = `use${action.charAt(0).toUpperCase()}${action.slice(1)}`

    if (hookKind === 'query' || hookKind === 'infinite_query') {
      hooks[hookName] = (options?: unknown, queryOptions?: unknown) =>
        useApiQuery(endpoint, options as never, queryOptions as never)
    } else {
      hooks[hookName] = (mutationOptions?: unknown) =>
        useApiMutation(endpoint, mutationOptions as never)
    }
  }

  return hooks as {
    [K in keyof T as `use${Capitalize<string & K>}`]: T[K] extends {
      $def: RouteDefinition<infer R, infer P, infer B>
    }
      ? T[K] extends { $def: { hookKind: 'query' | 'infinite_query' } }
        ? T[K] extends (...args: never[]) => unknown
          ? (...args: [...args: Parameters<T[K]>, queryOptions?: ApiQueryOptions<R>]) => ReturnType<typeof useApiQuery<R, P, B>>
          : never
        : (options?: ApiMutationOptions<R, ApiError, EndpointCallableOptions<P, B>>) => ReturnType<typeof useApiMutation<R, P, B>>
      : never
  }
}