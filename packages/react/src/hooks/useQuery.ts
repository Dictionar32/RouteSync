import { useQuery, useSuspenseQuery, useInfiniteQuery, UseQueryOptions, UseSuspenseQueryOptions, UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, OptionalIfEmpty, ApiError } from '@routesync/sdk'

/**
 * useApiQuery — accepts an endpoint callable directly.
 *
 * Usage:
 *   const { data, isLoading } = useApiQuery(api.produk.list)
 *   const { data } = useApiQuery(api.produk.detail, { params: { id: 10 } })
 */

export type ApiQueryOptions<TResponse, TError = ApiError, TData = TResponse> = Omit<UseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'>

export function useApiQuery<
  TResponse = unknown, 
  TParams = unknown, 
  TBody = unknown,
  TError = ApiError,
  TData = TResponse
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  ...args: [
    ...OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>,
    queryOptions?: Omit<UseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'>
  ]
) {
  const options = args[0] as EndpointCallableOptions<TParams, TBody> | undefined
  const queryOptions = args[1] as Omit<UseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'> | undefined
  
  const queryKey = endpoint.$queryKey(options as any)

  return useQuery<TResponse, TError, TData>({
    queryKey,
    queryFn: () => endpoint(options as any),
    ...queryOptions,
  })
}

/**
 * useApiSuspenseQuery — generic wrapper for Suspense-enabled data fetching (TanStack v5).
 */
export function useApiSuspenseQuery<
  TResponse = unknown, 
  TParams = unknown, 
  TBody = unknown,
  TError = ApiError,
  TData = TResponse
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  ...args: [
    ...OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>,
    queryOptions?: Omit<UseSuspenseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'>
  ]
) {
  const options = args[0] as EndpointCallableOptions<TParams, TBody> | undefined
  const queryOptions = args[1] as Omit<UseSuspenseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'> | undefined
  
  const queryKey = endpoint.$queryKey(options as any)

  return useSuspenseQuery<TResponse, TError, TData>({
    queryKey,
    queryFn: () => endpoint(options as any),
    ...queryOptions,
  })
}

/**
 * useApiInfiniteQuery — framework agnostic paginated fetching.
 */
export function useApiInfiniteQuery<
  TResponse = unknown, 
  TParams = unknown, 
  TBody = unknown,
  TError = ApiError,
  TData = InfiniteData<TResponse>,
  TPageParam = unknown
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  ...args: [
    ...OptionalIfEmpty<EndpointCallableOptions<TParams, TBody>>,
    queryOptions: Omit<UseInfiniteQueryOptions<TResponse, TError, TData, any, TPageParam>, 'queryKey' | 'queryFn'>
  ]
) {
  const options = args[0] as EndpointCallableOptions<TParams, TBody> | undefined
  // For infinite queries, the queryOptions must contain initialPageParam, so it's required.
  const queryOptions = (args.length > 1 ? args[1] : args[0]) as Omit<UseInfiniteQueryOptions<TResponse, TError, TData, any, TPageParam>, 'queryKey' | 'queryFn'>
  
  const queryKey = endpoint.$queryKey(options as any)

  return useInfiniteQuery<TResponse, TError, TData, any, TPageParam>({
    queryKey,
    queryFn: ({ pageParam }) => {
      // Pass pageParam transparently into options.
      // E.g. { ...options, query: { ...options?.query, page: pageParam } }
      // We do a shallow merge assuming `query` is an object.
      // This supports agnostic parameters, letting the consumer map it into the correct property inside endpoint(...)
      // Actually, to be strictly agnostic, we should just merge it into query as a default fallback, 
      // but ideally the user maps it. If we merge into `query`, Laravel users get ?page= automatically.
      const fetchOptions = { ...options } as any
      if (pageParam !== undefined) {
        fetchOptions.query = { ...(fetchOptions.query || {}), page: pageParam }
      }
      return endpoint(fetchOptions)
    },
    ...queryOptions,
  })
}
