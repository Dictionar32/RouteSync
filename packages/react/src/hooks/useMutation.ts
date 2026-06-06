// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, ApiError } from '@routesync/sdk'

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
export interface ApiMutationOptions<TData, TError, TVariables, TContext = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /** Extra endpoints to invalidate on success (in addition to the auto group invalidation). */
  invalidate?: EndpointCallable[]
}

export function useApiMutation<
  TResponse = unknown, 
  TParams = unknown, 
  TBody = unknown,
  TError = ApiError,
  TContext = unknown
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options?: ApiMutationOptions<TResponse, TError, EndpointCallableOptions<TParams, TBody>, TContext>
) {
  const queryClient = useQueryClient()
  const [group] = endpoint.$key

  return useMutation<TResponse, TError, EndpointCallableOptions<TParams, TBody>, TContext>({
    ...options,
    mutationFn: (variables: EndpointCallableOptions<TParams, TBody>) => endpoint(variables as never),
    onSuccess: (data: TResponse, variables: EndpointCallableOptions<TParams, TBody>, onMutateResult: TContext, context) => {
      // Auto-invalidate the endpoint's own group
      queryClient.invalidateQueries({ queryKey: [group] })

      // Invalidate any extra endpoints specified
      options?.invalidate?.forEach((ep) => {
        queryClient.invalidateQueries({ queryKey: ep.$key })
      })

      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}