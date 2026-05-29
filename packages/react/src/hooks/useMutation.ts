// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { EndpointCallable, CallOptions } from '@routesync/sdk'

/**
 * useApiMutation — accepts an endpoint callable directly.
 * Auto-invalidates the endpoint's group on success.
 *
 * Usage:
 *   const mutation = useApiMutation(api.cart.addItem)
 *   mutation.mutate({ body: { produk_id: 1, qty: 2 } })
 *
 *   // Custom invalidation:
 *   const mutation = useApiMutation(api.orders.checkout, {
 *     invalidate: [api.cart.list, api.orders.index],
 *   })
 */
export interface ApiMutationOptions<TData, TVariables>
  extends Omit<UseMutationOptions<TData, unknown, TVariables>, 'mutationFn'> {
  /** Extra endpoints to invalidate on success (in addition to the auto group invalidation). */
  invalidate?: EndpointCallable[]
}

export function useApiMutation<TData = any, TVariables extends CallOptions = CallOptions>(
  endpoint: EndpointCallable,
  options?: ApiMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient()
  const [group] = endpoint.$key

  return useMutation<TData, unknown, TVariables>({
    ...options,
    mutationFn: (variables: TVariables) => endpoint(variables) as Promise<TData>,
    onSuccess: (...args) => {
      // Auto-invalidate the endpoint's own group
      queryClient.invalidateQueries({ queryKey: [group] })

      // Invalidate any extra endpoints specified
      options?.invalidate?.forEach((ep) => {
        queryClient.invalidateQueries({ queryKey: ep.$key })
      })

      options?.onSuccess?.(...args)
    },
  })
}
