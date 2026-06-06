import { EndpointCallable, EndpointCallableOptions, OptionalIfEmpty, ApiError, RouteDefinition } from '@routesync/sdk'
import { useApiQuery, ApiQueryOptions } from './useQuery'
import { useApiMutation, ApiMutationOptions } from './useMutation'

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
export function createHooks<T extends Record<string, unknown>>(
  group: T
) {
  const hooks: Record<string, (...args: never) => unknown> = {}

  for (const [action, endpoint] of Object.entries(group)) {
    const method = (endpoint as EndpointCallable).$def.method
    const hookName = `use${action.charAt(0).toUpperCase()}${action.slice(1)}`

    if (method === 'GET') {
      hooks[hookName] = (options?: unknown, queryOptions?: unknown) =>
        useApiQuery(endpoint as EndpointCallable, options as never, queryOptions as never)
    } else {
      hooks[hookName] = (mutationOptions?: unknown) =>
        useApiMutation(endpoint as EndpointCallable, mutationOptions as never)
    }
  }

  return hooks as {
    [K in keyof T as `use${Capitalize<string & K>}`]: T[K] extends {
      $def: RouteDefinition<infer R, infer P, infer B, infer M>
    }
      ? M extends 'GET'
        ? T[K] extends (...args: never[]) => unknown
          ? (...args: [...args: Parameters<T[K]>, queryOptions?: ApiQueryOptions<R>]) => ReturnType<typeof useApiQuery<R, P, B>>
          : never
        : (options?: ApiMutationOptions<R, ApiError, EndpointCallableOptions<P, B>>) => ReturnType<typeof useApiMutation<R, P, B>>
      : never
  }
}