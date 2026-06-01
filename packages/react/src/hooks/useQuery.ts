import { useQuery, useSuspenseQuery, useInfiniteQuery, UseQueryOptions, UseSuspenseQueryOptions, UseInfiniteQueryOptions, InfiniteData } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions, LooseEndpointOptions, ApiError, CallOptions } from '@routesync/sdk'

export type ApiQueryOptions<TResponse, TError = ApiError, TData = TResponse> = Omit<UseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'>

// Overload 1: endpoint requires options (has params or required body)
export function useApiQuery<TResponse, TParams, TBody, TError = ApiError, TData = TResponse>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options: EndpointCallableOptions<TParams, TBody>,
  queryOptions?: ApiQueryOptions<TResponse, TError, TData>
): ReturnType<typeof useQuery<TResponse, TError, TData>>

// Overload 2: endpoint options are optional
export function useApiQuery<TResponse, TParams, TBody, TError = ApiError, TData = TResponse>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options?: LooseEndpointOptions,
  queryOptions?: ApiQueryOptions<TResponse, TError, TData>
): ReturnType<typeof useQuery<TResponse, TError, TData>>

// Implementation
export function useApiQuery<TResponse, TParams, TBody, TError = ApiError, TData = TResponse>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options?: LooseEndpointOptions,
  queryOptions?: ApiQueryOptions<TResponse, TError, TData>
) {
  const queryKey = options ? [...endpoint.$key, options] : endpoint.$key

  return useQuery<TResponse, TError, TData>({
    queryKey,
    queryFn: () => endpoint(options),
    ...queryOptions,
  })
}

export function useApiSuspenseQuery<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TError = ApiError,
  TData = TResponse
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options?: LooseEndpointOptions,
  queryOptions?: Omit<UseSuspenseQueryOptions<TResponse, TError, TData>, 'queryKey' | 'queryFn'>
) {
  const queryKey = options ? [...endpoint.$key, options] : endpoint.$key

  return useSuspenseQuery<TResponse, TError, TData>({
    queryKey,
    queryFn: () => endpoint(options),
    ...queryOptions,
  })
}

export function useApiInfiniteQuery<
  TResponse = unknown,
  TParams = unknown,
  TBody = unknown,
  TError = ApiError,
  TData = InfiniteData<TResponse>,
  TPageParam = unknown
>(
  endpoint: EndpointCallable<TResponse, TParams, TBody>,
  options: LooseEndpointOptions | undefined,
  queryOptions: Omit<UseInfiniteQueryOptions<TResponse, TError, TData, any, TPageParam>, 'queryKey' | 'queryFn'> & {
    getNextPageParam: UseInfiniteQueryOptions<TResponse, TError, TData, any, TPageParam>['getNextPageParam']
  }
) {
  const queryKey = options ? [...endpoint.$key, options] : endpoint.$key

  return useInfiniteQuery<TResponse, TError, TData, any, TPageParam>({
    queryKey,
    queryFn: ({ pageParam }) => {
      const callOptions: CallOptions<TParams, TBody> = {
        params: options?.params as TParams,
        body: options?.body as TBody,
        headers: options?.headers,
        query: { ...options?.query, page: pageParam },
      }
      return endpoint(callOptions)
    },
    ...queryOptions,
  })
}
