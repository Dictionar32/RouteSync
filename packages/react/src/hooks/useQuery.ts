// @ts-ignore TanStack Query is a peer dependency provided by consumers.
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

export function useApiQuery<T>(
  queryKey: string[],
  fetcher: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey,
    queryFn: fetcher,
    ...options
  })
}
