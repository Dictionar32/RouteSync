import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { type EndpointCallable, type EndpointCallableOptions } from '@routesync/sdk'

export interface ApiQueryClientOperations {
  readonly queryClient: QueryClient;
  readonly invalidateEndpoint: <TResponse, TParams, TBody>(
    endpoint: EndpointCallable<TResponse, TParams, TBody>,
    options?: EndpointCallableOptions<TParams, TBody>
  ) => Promise<void>;
  readonly prefetchEndpoint: <TResponse, TParams, TBody>(
    endpoint: EndpointCallable<TResponse, TParams, TBody>,
    options?: EndpointCallableOptions<TParams, TBody>
  ) => Promise<void>;
  readonly setEndpointData: <TResponse, TParams, TBody>(
    endpoint: EndpointCallable<TResponse, TParams, TBody>,
    options: EndpointCallableOptions<TParams, TBody> | undefined,
    updater: TResponse | ((oldData: TResponse | undefined) => TResponse)
  ) => TResponse | undefined;
  readonly getEndpointData: <TResponse, TParams, TBody>(
    endpoint: EndpointCallable<TResponse, TParams, TBody>,
    options?: EndpointCallableOptions<TParams, TBody>
  ) => TResponse | undefined;
}

export function useApiQueryClient(): ApiQueryClientOperations {
  const queryClient = useQueryClient()

  return {
    queryClient: queryClient,
    
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
