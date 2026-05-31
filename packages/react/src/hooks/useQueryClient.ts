import { useQueryClient, QueryClient } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions } from '@routesync/sdk'

/**
 * useApiQueryClient — a typed wrapper over TanStack's QueryClient
 * 
 * Provides ergonomic helpers like invalidateEndpoint and prefetchEndpoint
 * with strong typing based on the RouteSync SDK contracts.
 */
export function useApiQueryClient() {
  const queryClient = useQueryClient()

  return {
    queryClient,
    
    /**
     * Invalidate specific queries related to an endpoint.
     * Optionally pass parameters to invalidate a more specific cache entry.
     */
    invalidateEndpoint: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ) => {
      return queryClient.invalidateQueries({
        queryKey: endpoint.$queryKey(options as any)
      })
    },

    /**
     * Prefetch data for an endpoint into the cache.
     * Useful for SSR, RSC hydration, or proactive prefetching.
     */
    prefetchEndpoint: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ) => {
      return queryClient.prefetchQuery({
        queryKey: endpoint.$queryKey(options as any),
        queryFn: () => endpoint(options as any)
      })
    },

    /**
     * Manually update the cache for a specific endpoint.
     * Often used for optimistic updates in mutations.
     */
    setEndpointData: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options: EndpointCallableOptions<TParams, TBody> | undefined,
      updater: TResponse | ((oldData: TResponse | undefined) => TResponse)
    ) => {
      return queryClient.setQueryData(endpoint.$queryKey(options as any), updater)
    },

    /**
     * Retrieve the current cached data for a specific endpoint.
     */
    getEndpointData: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ): TResponse | undefined => {
      return queryClient.getQueryData<TResponse>(endpoint.$queryKey(options as any))
    }
  }
}
