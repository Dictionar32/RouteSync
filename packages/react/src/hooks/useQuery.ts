// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { EndpointCallable, CallOptions } from '@routesync/sdk'

/**
 * useApiQuery — accepts an endpoint callable directly.
 *
 * Usage:
 *   const { data, isLoading } = useApiQuery(api.produk.list)
 *   const { data } = useApiQuery(api.produk.detail, { params: { id: 10 } })
 */
export function useApiQuery<T = any>(
  endpoint: EndpointCallable,
  options?: CallOptions,
  queryOptions?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const queryKey = options
    ? [...endpoint.$key, options]
    : endpoint.$key

  return useQuery<T>({
    queryKey,
    queryFn: () => endpoint(options) as Promise<T>,
    ...queryOptions,
  })
}
