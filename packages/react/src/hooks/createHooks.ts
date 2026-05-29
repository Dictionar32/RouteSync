// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQueryClient } from '@tanstack/react-query'
import { EndpointCallable } from '@routesync/sdk'
import { useApiQuery } from './useQuery'
import { useApiMutation } from './useMutation'

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
export function createHooks<T extends Record<string, EndpointCallable>>(
  group: T
) {
  const hooks: Record<string, (...args: any[]) => any> = {}

  for (const [action, endpoint] of Object.entries(group)) {
    const method = endpoint.$def.method
    const hookName = `use${action.charAt(0).toUpperCase()}${action.slice(1)}`

    if (method === 'GET' || method === 'DELETE') {
      hooks[hookName] = (options?: any, queryOptions?: any) =>
        useApiQuery(endpoint, options, queryOptions)
    } else {
      hooks[hookName] = (mutationOptions?: any) =>
        useApiMutation(endpoint, mutationOptions)
    }
  }

  return hooks as {
    [K in keyof T as `use${Capitalize<string & K>}`]: T[K] extends EndpointCallable
      ? T[K]['$def']['method'] extends 'GET' | 'DELETE'
        ? (options?: any, queryOptions?: any) => ReturnType<typeof useApiQuery>
        : (options?: any) => ReturnType<typeof useApiMutation>
      : never
  }
}