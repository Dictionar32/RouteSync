import { useQueryClient, QueryClient } from '@tanstack/react-query'
import { EndpointCallable, EndpointCallableOptions } from '@routesync/sdk'

export function useApiQueryClient() {
  const queryClient = useQueryClient()

  return {
    queryClient,
    
    invalidateEndpoint: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ) => {
      return queryClient.invalidateQueries({
        queryKey: endpoint.$queryKey(options)
      })
    },

    prefetchEndpoint: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ) => {
      return queryClient.prefetchQuery({
        queryKey: endpoint.$queryKey(options),
        queryFn: () => endpoint(options)
      })
    },

    setEndpointData: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options: EndpointCallableOptions<TParams, TBody> | undefined,
      updater: TResponse | ((oldData: TResponse | undefined) => TResponse)
    ) => {
      return queryClient.setQueryData(endpoint.$queryKey(options), updater)
    },

    getEndpointData: <TResponse, TParams, TBody>(
      endpoint: EndpointCallable<TResponse, TParams, TBody>,
      options?: EndpointCallableOptions<TParams, TBody>
    ): TResponse | undefined => {
      return queryClient.getQueryData<TResponse>(endpoint.$queryKey(options))
    }
  }
}